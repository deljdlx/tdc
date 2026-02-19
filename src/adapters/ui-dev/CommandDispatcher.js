/**
 * CommandDispatcher — mappe les intents UI vers les Commands du moteur.
 *
 * Abstraction entre la UI et le moteur.
 * Si on change les Commands, on modifie juste ici, pas la UI.
 *
 * Permet aussi de centraliser les préconditions et la validation.
 */

import PlayCreatureCommand from '../../gameplay/commands/PlayCreatureCommand.js'
import PlaySpellCommand from '../../gameplay/commands/PlaySpellCommand.js'
import AttackCommand from '../../gameplay/commands/AttackCommand.js'
import EndTurnCommand from '../../gameplay/commands/EndTurnCommand.js'

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
     * Joue une créature.
     *
     * @param {string} playerId
     * @param {string} cardId
     */
    playCreature(playerId, cardId) {
        this._engine.enqueueCommand(new PlayCreatureCommand({
            playerId,
            cardId
        }))
    }

    /**
     * Joue un sort.
     *
     * @param {string} playerId
     * @param {string} cardId
     * @param {string} [targetId] - ID de la cible (joueur ou créature)
     */
    playSpell(playerId, cardId, targetId) {
        this._engine.enqueueCommand(new PlaySpellCommand({
            playerId,
            cardId,
            targetId
        }))
    }

    /**
     * Attaque avec une créature.
     *
     * @param {string} playerId
     * @param {string} attackerId
     * @param {string} targetId - ID de la cible (joueur ou créature)
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
     * Exécute la queue jusqu'à idle.
     */
    runUntilIdle() {
        this._engine.runUntilIdle()
    }
}
