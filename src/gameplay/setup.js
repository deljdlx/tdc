/**
 * Setup du scénario Hearthstone simplifié.
 *
 * Enregistre les ZoneTypes, Commands, IntentResolvers,
 * initialise le state et lance la partie.
 */

import Engine from '../core/engine/Engine.js'
import StartGameCommand from './commands/StartGameCommand.js'
import StartTurnCommand from './commands/StartTurnCommand.js'
import DrawCardsCommand from './commands/DrawCardsCommand.js'
import DestroyHeroCommand from './commands/DestroyHeroCommand.js'
import PlaySpellCommand from './commands/PlaySpellCommand.js'
import AttackCommand from './commands/AttackCommand.js'
import EndTurnCommand from './commands/EndTurnCommand.js'
import DealDamageCommand from './commands/DealDamageCommand.js'
import RestoreHpCommand from './commands/RestoreHpCommand.js'
import CheckWinConditionCommand from './commands/CheckWinConditionCommand.js'
import DefendCommand from './commands/DefendCommand.js'
import UsePowerCommand from './commands/UsePowerCommand.js'
import ApplyBuffCommand from './commands/ApplyBuffCommand.js'

/**
 * Crée et configure un Engine prêt à jouer le scénario.
 *
 * @param {Object} options
 * @param {number} [options.seed=42]          - Seed RNG
 * @param {string} [options.player1='player1'] - ID joueur 1
 * @param {string} [options.player2='player2'] - ID joueur 2
 * @returns {Engine}
 */
export function createGame({ seed = 42, player1 = 'player1', player2 = 'player2' } = {}) {
    const engine = new Engine({ seed })

    // Enregistrer les ZoneTypes
    engine.zoneTypeRegistry.register({ id: 'deck', ordered: true, visibility: 'hidden', maxSize: null })
    engine.zoneTypeRegistry.register({ id: 'hand', ordered: true, visibility: 'owner', maxSize: 10 })
    engine.zoneTypeRegistry.register({ id: 'board', ordered: false, visibility: 'public', maxSize: 5 })
    engine.zoneTypeRegistry.register({ id: 'graveyard', ordered: true, visibility: 'public', maxSize: null })

    // Enregistrer les Commands
    engine.commandRegistry.register(StartGameCommand)
    engine.commandRegistry.register(StartTurnCommand)
    engine.commandRegistry.register(DrawCardsCommand)
    engine.commandRegistry.register(PlaySpellCommand)
    engine.commandRegistry.register(AttackCommand)
    engine.commandRegistry.register(EndTurnCommand)
    engine.commandRegistry.register(DestroyHeroCommand)
    engine.commandRegistry.register(DealDamageCommand)
    engine.commandRegistry.register(RestoreHpCommand)
    engine.commandRegistry.register(CheckWinConditionCommand)
    engine.commandRegistry.register(DefendCommand)
    engine.commandRegistry.register(UsePowerCommand)
    engine.commandRegistry.register(ApplyBuffCommand)

    // Enregistrer les IntentResolvers
    engine.intentResolver.register('DRAW_CARDS', (intent) => {
        return new DrawCardsCommand(intent.payload)
    })

    engine.intentResolver.register('START_TURN_INTENT', (intent) => {
        return new StartTurnCommand(intent.payload)
    })

    engine.intentResolver.register('DESTROY_HERO', (intent) => {
        return new DestroyHeroCommand(intent.payload)
    })

    engine.intentResolver.register('RESOLVE_DEAL_DAMAGE', (intent) => {
        return new DealDamageCommand(intent.payload)
    })

    engine.intentResolver.register('RESOLVE_RESTORE_HP', (intent) => {
        return new RestoreHpCommand(intent.payload)
    })

    engine.intentResolver.register('CHECK_WIN_CONDITION', (intent) => {
        return new CheckWinConditionCommand(intent.payload)
    })

    engine.intentResolver.register('RESOLVE_APPLY_BUFF', (intent) => {
        return new ApplyBuffCommand(intent.payload)
    })

    // Initialiser le state
    engine.initialize({
        players: {
            [player1]: { id: player1, name: 'Player 1', attributes: {} },
            [player2]: { id: player2, name: 'Player 2', attributes: {} }
        },
        cards: {},
        heroes: {},
        zones: {},
        turnState: { activePlayerId: null, turnNumber: 0, phase: null }
    })

    return engine
}

/**
 * Lance une partie complète : setup + start game.
 *
 * @param {Object} options - Mêmes options que createGame
 * @returns {Engine} Engine avec la partie en cours
 */
export function startGame(options = {}) {
    const engine = createGame(options)

    engine.enqueueCommand(new StartGameCommand())
    engine.runUntilIdle()

    return engine
}
