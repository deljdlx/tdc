/**
 * Generation dynamique du graphe de commandes.
 *
 * Les noeuds et aretes sont construits a partir des proprietes
 * statiques `type`, `category` et `edges` declarees sur chaque
 * classe de commande.
 */

import StartGameCommand from '../commands/StartGameCommand.js'
import StartTurnCommand from '../commands/StartTurnCommand.js'
import DrawCardsCommand from '../commands/DrawCardsCommand.js'
import EndTurnCommand from '../commands/EndTurnCommand.js'
import PlaySpellCommand from '../commands/PlaySpellCommand.js'
import AttackCommand from '../commands/AttackCommand.js'
import DealDamageCommand from '../commands/DealDamageCommand.js'
import RestoreHpCommand from '../commands/RestoreHpCommand.js'
import DestroyHeroCommand from '../commands/DestroyHeroCommand.js'
import CheckWinConditionCommand from '../commands/CheckWinConditionCommand.js'
import DefendCommand from '../commands/DefendCommand.js'
import UsePowerCommand from '../commands/UsePowerCommand.js'
import ApplyBuffCommand from '../commands/ApplyBuffCommand.js'

/** Categories de noeuds pour la coloration. */
const CATEGORY = {
    GAME_FLOW: 'game_flow',
    PLAYER_ACTION: 'player_action',
    EFFECT: 'effect',
    TERMINAL: 'terminal'
}

const ALL_COMMANDS = [
    StartGameCommand,
    StartTurnCommand,
    DrawCardsCommand,
    EndTurnCommand,
    PlaySpellCommand,
    AttackCommand,
    DealDamageCommand,
    RestoreHpCommand,
    DestroyHeroCommand,
    CheckWinConditionCommand,
    DefendCommand,
    UsePowerCommand,
    ApplyBuffCommand
]

/** Convertit UPPER_SNAKE_CASE en Title Case lisible. */
function toLabel(type) {
    return type
        .split('_')
        .map(w => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
}

const NODES = ALL_COMMANDS.map(Cmd => ({
    data: {
        id: Cmd.type,
        label: toLabel(Cmd.type),
        category: Cmd.category
    }
}))

const EDGES = ALL_COMMANDS.flatMap(Cmd =>
    (Cmd.edges || []).map(edge => ({
        data: {
            source: Cmd.type,
            target: edge.target,
            label: edge.label,
            conditional: edge.conditional ?? false
        }
    }))
)

/** Couleurs par categorie de noeud. */
const CATEGORY_COLORS = {
    [CATEGORY.GAME_FLOW]: '#7BA7CC',
    [CATEGORY.PLAYER_ACTION]: '#F0C858',
    [CATEGORY.EFFECT]: '#B8A0E0',
    [CATEGORY.TERMINAL]: '#E94560'
}

/** Labels lisibles pour chaque categorie. */
const CATEGORY_LABELS = {
    [CATEGORY.GAME_FLOW]: 'Game Flow',
    [CATEGORY.PLAYER_ACTION]: 'Player Action',
    [CATEGORY.EFFECT]: 'Effect',
    [CATEGORY.TERMINAL]: 'Terminal'
}

export { NODES, EDGES, CATEGORY, CATEGORY_COLORS, CATEGORY_LABELS }
