/**
 * Engine — orchestrateur principal du moteur TCG.
 *
 * Responsabilités :
 * - Gère la commandQueue et l'intentQueue
 * - Exécute les commands via step()
 * - Délègue les patches au PatchApplier
 * - Émet les DomainEvents via le DomainEventBus
 * - Résout les intents via l'IntentResolver
 * - Gère les effets continus (TriggerEngine, ReplacementPipeline)
 * - Gère les choix joueur (ChoiceSystem)
 * - Détecte les cycles et les pauses
 *
 * Invariants fondamentaux :
 * - CommandLog + RandomTape = seule source de vérité
 * - Replay intégral possible
 * - Aucune mutation du state hors PatchApplier
 * - step() exécute exactement une Command
 * - RuntimeBus n'influence jamais le replay
 *
 *   ┌─────────────┐
 *   │ enqueueCmd  │───→ commandQueue
 *   └─────────────┘          │
 *         ┌──────────────────┘
 *         ▼
 *   ┌───────────┐  validate   ┌──────────────┐
 *   │  step()   │─────────────│ REJECTED ?   │──→ log + skip
 *   └───────────┘             └──────────────┘
 *         │ apply
 *         ▼
 *   ┌─────────────────────┐
 *   │ ReplacementPipeline │──→ transform / veto
 *   └─────────────────────┘
 *         │
 *         ▼
 *   patches ──→ PatchApplier ──→ new state
 *   events  ──→ DomainEventBus ──→ TriggerEngine ──→ intents
 *   intents ──→ intentQueue ──→ IntentResolver ──→ commandQueue
 */

import PatchApplier from '../state/PatchApplier.js'
import DomainEventBus from '../events/DomainEventBus.js'
import RuntimeBus from '../events/RuntimeBus.js'
import RandomTape from '../rng/RandomTape.js'
import CommandLog from '../commands/CommandLog.js'
import CommandRegistry from '../commands/CommandRegistry.js'
import IntentResolver from './IntentResolver.js'
import PausePolicy from './PausePolicy.js'
import CycleDetector from './CycleDetector.js'
import IdGenerator from './IdGenerator.js'
import ZoneTypeRegistry from './ZoneTypeRegistry.js'
import QueryAPI from '../query/QueryAPI.js'
import TriggerEngine from '../effects/TriggerEngine.js'
import ReplacementPipeline from '../effects/ReplacementPipeline.js'
import ChoiceSystem from '../effects/ChoiceSystem.js'

/**
 * Status possibles retournés par step().
 */
export const StepStatus = Object.freeze({
    /** Plus rien à exécuter */
    IDLE: 'idle',
    /** D'autres commands/intents attendent */
    CONTINUE: 'continue',
    /** PausePolicy a demandé une pause */
    PAUSED: 'paused',
    /** Cycle détecté */
    CYCLE: 'cycle'
})

export default class Engine {

    /** @type {PatchApplier} */
    _patchApplier;

    /** @type {DomainEventBus} */
    _domainEventBus;

    /** @type {RuntimeBus} */
    _runtimeBus;

    /** @type {RandomTape} */
    _randomTape;

    /** @type {CommandLog} */
    _commandLog;

    /** @type {CommandRegistry} */
    _commandRegistry;

    /** @type {IntentResolver} */
    _intentResolver;

    /** @type {PausePolicy} */
    _pausePolicy;

    /** @type {CycleDetector} */
    _cycleDetector;

    /** @type {IdGenerator} */
    _idGenerator;

    /** @type {ZoneTypeRegistry} */
    _zoneTypeRegistry;

    /** @type {QueryAPI} */
    _queryAPI;

    /** @type {TriggerEngine} */
    _triggerEngine;

    /** @type {ReplacementPipeline} */
    _replacementPipeline;

    /** @type {ChoiceSystem} */
    _choiceSystem;

    /** @type {Object} State courant du jeu */
    _state;

    /** @type {Object} Copie du state initial (pour export replay) */
    _initialState;

    /** @type {Object[]} File d'attente des commands */
    _commandQueue;

    /** @type {Object[]} File d'attente des intents */
    _intentQueue;

    /** @type {number} Compteur de version du state */
    _version;

    /** @type {boolean} true = on rejoue un log existant */
    _replayMode;

    /**
     * @param {Object} options
     * @param {number} options.seed - Seed pour le RNG
     */
    constructor({ seed = 42 } = {}) {
        this._patchApplier = new PatchApplier()
        this._domainEventBus = new DomainEventBus()
        this._runtimeBus = new RuntimeBus()
        this._randomTape = new RandomTape({ seed })
        this._commandLog = new CommandLog()
        this._commandRegistry = new CommandRegistry()
        this._intentResolver = new IntentResolver()
        this._pausePolicy = new PausePolicy()
        this._cycleDetector = new CycleDetector()
        this._idGenerator = new IdGenerator()
        this._zoneTypeRegistry = new ZoneTypeRegistry()
        this._triggerEngine = new TriggerEngine()
        this._replacementPipeline = new ReplacementPipeline()
        this._choiceSystem = new ChoiceSystem()

        this._state = this._createEmptyState()
        this._initialState = null
        this._queryAPI = new QueryAPI(this._state, this._zoneTypeRegistry)

        this._commandQueue = []
        this._intentQueue = []
        this._version = 0
        this._replayMode = false
    }

    // =====================
    // ACCESSORS
    // =====================

    /** @returns {Object} State courant (lecture seule) */
    get state() { return this._state }

    /** @returns {CommandRegistry} */
    get commandRegistry() { return this._commandRegistry }

    /** @returns {IntentResolver} */
    get intentResolver() { return this._intentResolver }

    /** @returns {PausePolicy} */
    get pausePolicy() { return this._pausePolicy }

    /** @returns {DomainEventBus} */
    get domainEventBus() { return this._domainEventBus }

    /** @returns {RuntimeBus} */
    get runtimeBus() { return this._runtimeBus }

    /** @returns {ZoneTypeRegistry} */
    get zoneTypeRegistry() { return this._zoneTypeRegistry }

    /** @returns {RandomTape} */
    get randomTape() { return this._randomTape }

    /** @returns {IdGenerator} */
    get idGenerator() { return this._idGenerator }

    /** @returns {QueryAPI} */
    get queryAPI() { return this._queryAPI }

    /** @returns {TriggerEngine} */
    get triggerEngine() { return this._triggerEngine }

    /** @returns {ReplacementPipeline} */
    get replacementPipeline() { return this._replacementPipeline }

    /** @returns {ChoiceSystem} */
    get choiceSystem() { return this._choiceSystem }

    /** @returns {number} */
    get version() { return this._version }

    // =====================
    // SETUP
    // =====================

    /**
     * Initialise le state de la partie.
     * Doit être appelé après l'enregistrement des ZoneTypes et Commands.
     *
     * @param {Object} state - State initial
     */
    initialize(state) {
        this._state = { ...state, version: 0 }
        this._initialState = JSON.parse(JSON.stringify(this._state))
        this._queryAPI.updateState(this._state)
        this._version = 0
    }

    // =====================
    // COMMAND QUEUE
    // =====================

    /**
     * Ajoute une command à la file d'attente.
     *
     * @param {Object} command - Instance de Command (doit avoir type, validate, apply)
     */
    enqueueCommand(command) {
        this._commandQueue.push(command)
    }

    // =====================
    // STEP
    // =====================

    /**
     * Exécute exactement une Command.
     *
     * 1. Si commandQueue vide → résout le prochain intent
     * 2. Déqueue la command
     * 3. Validate → si invalide : emit COMMAND_REJECTED, log, skip
     * 4. Apply → patches + events + intents
     * 5. ReplacementPipeline → transform / veto
     * 6. Applique les patches
     * 7. Émet les events → TriggerEngine → intents supplémentaires
     * 8. Enqueue les intents
     * 9. Log la command
     * 10. Vérifie pause et cycle
     *
     * @returns {{ status: string, pauseHint: string|null }}
     */
    step() {
        // Si la commandQueue est vide, essayer de résoudre un intent
        if (this._commandQueue.length === 0 && this._intentQueue.length > 0) {
            this._resolveNextIntent()
        }

        // Si toujours rien, on est idle
        if (this._commandQueue.length === 0) {
            return { status: StepStatus.IDLE, pauseHint: null }
        }

        const command = this._commandQueue.shift()
        const commandType = command.constructor.type

        this._runtimeBus.emit('step:start', { commandType })

        // Construire le contexte pour la command
        const ctx = this._buildContext()

        // Valider
        const validation = command.validate(this._state, ctx)

        if (!validation.valid) {
            return this._handleRejection(command, commandType, validation.reason)
        }

        // Appliquer
        let result = command.apply(this._state, ctx)

        // ReplacementPipeline — peut transformer ou annuler le résultat
        const replacement = this._replacementPipeline.process(
            commandType, result, this._state
        )

        if (replacement.replaced) {
            if (replacement.result === null) {
                // VETO — la command est annulée par un replacement
                return this._handleVeto(command, commandType, replacement.replacementId)
            }
            result = replacement.result
        }

        const { patches = [], domainEvents = [], intents = [] } = result

        // Appliquer les patches
        for (const patch of patches) {
            this._state = this._patchApplier.apply(this._state, patch)
            this._version++
            this._state = { ...this._state, version: this._version }
        }
        this._queryAPI.updateState(this._state)

        // Émettre les domain events
        for (const event of domainEvents) {
            this._domainEventBus.emit(event)
        }
        const batch = this._domainEventBus.flush()

        // En replay, les commands issues des triggers/intents sont déjà dans le log.
        // On ne les regénère pas pour éviter les doublons.
        if (!this._replayMode) {
            // TriggerEngine — génère des intents à partir des events
            this._triggerEngine.processBatch(batch, this._state)
            const triggeredIntents = this._triggerEngine.flush()

            // Enqueue les intents (de la command + des triggers)
            for (const intent of [...intents, ...triggeredIntents]) {
                this._intentQueue.push(intent)
            }
        }

        // Log la command
        this._commandLog.record({
            type: commandType,
            payload: command.payload
        })

        this._runtimeBus.emit('step:end', { status: 'applied' })

        return this._evaluatePostStep(batch)
    }

    /**
     * Exécute des steps jusqu'à idle, pause ou cycle.
     *
     * @param {number} [maxSteps=1000] - Garde-fou contre les boucles
     * @returns {{ status: string, steps: number }}
     */
    runUntilIdle(maxSteps = 1000) {
        let steps = 0

        while (steps < maxSteps) {
            const result = this.step()
            steps++

            if (result.status !== StepStatus.CONTINUE) {
                return { status: result.status, steps }
            }
        }

        return { status: 'max_steps', steps }
    }

    // =====================
    // REPLAY
    // =====================

    /**
     * Exporte les données nécessaires au replay.
     *
     * @returns {{ commandLog: Object[], randomTape: number[], initialState: Object }}
     */
    exportReplay() {
        return {
            commandLog: this._commandLog.entries.map(e => ({ ...e })),
            randomTape: this._randomTape.tape,
            initialState: JSON.parse(JSON.stringify(this._initialState))
        }
    }

    /**
     * Importe un replay et prépare l'Engine pour le rejouer.
     *
     * @param {Object} replay
     * @param {Object[]} replay.commandLog
     * @param {number[]} replay.randomTape
     * @param {Object}   replay.initialState
     */
    importReplay(replay) {
        this._commandQueue = []
        this._intentQueue = []
        this._cycleDetector.reset()
        this._domainEventBus.reset()
        this._version = 0

        this._state = JSON.parse(JSON.stringify(replay.initialState))
        this._initialState = JSON.parse(JSON.stringify(replay.initialState))
        this._queryAPI.updateState(this._state)

        this._randomTape = new RandomTape({
            seed: 0,
            tape: replay.randomTape
        })

        // Enqueue les commands du log et activer le mode replay
        for (const entry of replay.commandLog) {
            const command = this._commandRegistry.create(entry.type, entry.payload)
            this._commandQueue.push(command)
        }
        this._replayMode = true
    }

    // =====================
    // VIEW
    // =====================

    /**
     * Retourne une vue sérialisable du state (IDs only).
     *
     * @returns {Object}
     */
    getView() {
        return JSON.parse(JSON.stringify(this._state))
    }

    /**
     * Retourne un hash simple du state pour vérifier le déterminisme.
     *
     * @returns {string}
     */
    getViewHash() {
        return JSON.stringify(this._state)
    }

    // =====================
    // PRIVATE
    // =====================

    /**
     * @returns {Object}
     */
    _createEmptyState() {
        return {
            players: {},
            cards: {},
            zones: {},
            turnState: {
                activePlayerId: null,
                turnNumber: 0,
                phase: null
            },
            version: 0
        }
    }

    /**
     * Construit le contexte passé aux commands.
     *
     * @returns {Object}
     */
    _buildContext() {
        return {
            query: this._queryAPI,
            random: this._randomTape,
            idGenerator: this._idGenerator,
            zoneTypeRegistry: this._zoneTypeRegistry,
            choiceSystem: this._choiceSystem
        }
    }

    /**
     * Résout le prochain intent de la file en command.
     */
    _resolveNextIntent() {
        if (this._intentQueue.length === 0) {
            return
        }

        const intent = this._intentQueue.shift()
        const ctx = this._buildContext()
        const command = this._intentResolver.resolve(intent, ctx)

        if (command) {
            this._commandQueue.push(command)
        } else {
            this._runtimeBus.emit('intent:unresolved', { intent })
        }
    }

    /**
     * Gère le rejet d'une command invalide.
     *
     * @param {Object} command
     * @param {string} commandType
     * @param {string} reason
     * @returns {{ status: string, pauseHint: string|null }}
     */
    _handleRejection(command, commandType, reason) {
        const rejectEvent = {
            type: 'COMMAND_REJECTED',
            payload: { commandType, reason },
            sourceCommandType: commandType
        }

        this._domainEventBus.emit(rejectEvent)
        const batch = this._domainEventBus.flush()

        this._commandLog.record({
            type: commandType,
            payload: command.payload
        })

        this._runtimeBus.emit('command:rejected', { commandType, reason })
        this._runtimeBus.emit('step:end', { status: 'rejected' })

        return this._evaluatePostStep(batch)
    }

    /**
     * Gère le veto d'une command par un replacement effect.
     *
     * @param {Object} command
     * @param {string} commandType
     * @param {string} replacementId
     * @returns {{ status: string, pauseHint: string|null }}
     */
    _handleVeto(command, commandType, replacementId) {
        const vetoEvent = {
            type: 'COMMAND_VETOED',
            payload: { commandType, replacementId },
            sourceCommandType: commandType
        }

        this._domainEventBus.emit(vetoEvent)
        const batch = this._domainEventBus.flush()

        this._commandLog.record({
            type: commandType,
            payload: command.payload
        })

        this._runtimeBus.emit('command:vetoed', { commandType, replacementId })
        this._runtimeBus.emit('step:end', { status: 'vetoed' })

        return this._evaluatePostStep(batch)
    }

    /**
     * Évalue pause et cycle après un step.
     *
     * @param {Object[]} eventBatch
     * @returns {{ status: string, pauseHint: string|null }}
     */
    _evaluatePostStep(eventBatch) {
        const pauseHint = this._pausePolicy.evaluate(eventBatch)
        if (pauseHint) {
            return { status: StepStatus.PAUSED, pauseHint }
        }

        const hasCycle = this._cycleDetector.check(
            this._state,
            this._commandQueue.length,
            this._intentQueue.length,
            this._randomTape.index
        )

        if (hasCycle) {
            return { status: StepStatus.CYCLE, pauseHint: null }
        }

        const hasWork =
            this._commandQueue.length > 0 ||
            this._intentQueue.length > 0

        return {
            status: hasWork ? StepStatus.CONTINUE : StepStatus.IDLE,
            pauseHint: null
        }
    }
}
