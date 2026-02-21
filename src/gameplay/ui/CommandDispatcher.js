/**
 * CommandDispatcher — mappe les intents UI vers les Commands du moteur.
 *
 * Abstraction entre la UI et le moteur.
 * Si on change les Commands, on modifie juste ici, pas la UI.
 *
 * Permet aussi de centraliser les préconditions et la validation.
 */

import PlaySpellCommand from '../commands/PlaySpellCommand.js'
import AttackCommand from '../commands/AttackCommand.js'
import EndTurnCommand from '../commands/EndTurnCommand.js'
import DefendCommand from '../commands/DefendCommand.js'
import UsePowerCommand from '../commands/UsePowerCommand.js'

export default class CommandDispatcher {
    /**
     * @param {Engine} [engine]
     */
    constructor(engine) {
        this._engine = engine
    }

    /**
     * Set the engine instance.
     */
    setEngine(engine) {
        this._engine = engine
    }

    /**
     * Joue un sort.
     *
     * @param {string} playerId
     * @param {string} cardId
     * @param {string} [targetId] - ID de la cible (héro)
     */
    playSpell(playerId, cardId, targetId) {
        this._engine.enqueueCommand(new PlaySpellCommand({
            playerId,
            cardId,
            targetId
        }))
    }

    /**
     * Attaque avec un héro.
     *
     * @param {string} playerId
     * @param {string} attackerId - ID du héro attaquant
     * @param {string} targetId - ID du héro cible
     */
    attack(playerId, attackerId, targetId) {
        this._engine.enqueueCommand(new AttackCommand({
            playerId,
            attackerId,
            targetId
        }))
    }

    /**
     * Termine le tour.
     *
     * @param {string} playerId
     */
    endTurn(playerId) {
        this._engine.enqueueCommand(new EndTurnCommand({
            playerId
        }))
    }

    /**
     * Un hero se defend.
     *
     * @param {string} playerId
     * @param {string} heroId
     */
    defend(playerId, heroId) {
        this._engine.enqueueCommand(new DefendCommand({
            playerId,
            heroId
        }))
    }

    /**
     * Un hero utilise un pouvoir.
     *
     * @param {string} playerId
     * @param {string} heroId
     * @param {string} powerId
     * @param {string} [targetId]
     */
    usePower(playerId, heroId, powerId, targetId) {
        this._engine.enqueueCommand(new UsePowerCommand({
            playerId,
            heroId,
            powerId,
            targetId
        }))
    }

    /**
     * Exécute la queue jusqu'à idle.
     */
    runUntilIdle() {
        this._engine.runUntilIdle()
    }
}
