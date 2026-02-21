/**
 * Donnees statiques du graphe de commandes.
 *
 * Chaque noeud represente une commande du moteur.
 * Chaque arete represente un intent emis par une commande
 * qui resout vers une autre commande via l'IntentResolver.
 */

/** Categories de noeuds pour la coloration. */
const CATEGORY = {
    GAME_FLOW: 'game_flow',
    PLAYER_ACTION: 'player_action',
    EFFECT: 'effect',
    TERMINAL: 'terminal'
}

const NODES = [
    { data: { id: 'START_GAME', label: 'Start Game', category: CATEGORY.GAME_FLOW } },
    { data: { id: 'START_TURN', label: 'Start Turn', category: CATEGORY.GAME_FLOW } },
    { data: { id: 'DRAW_CARDS', label: 'Draw Cards', category: CATEGORY.GAME_FLOW } },
    { data: { id: 'END_TURN', label: 'End Turn', category: CATEGORY.GAME_FLOW } },
    { data: { id: 'PLAY_CREATURE', label: 'Play Creature', category: CATEGORY.PLAYER_ACTION } },
    { data: { id: 'PLAY_SPELL', label: 'Play Spell', category: CATEGORY.PLAYER_ACTION } },
    { data: { id: 'ATTACK', label: 'Attack', category: CATEGORY.PLAYER_ACTION } },
    { data: { id: 'DEAL_DAMAGE_EFFECT', label: 'Deal Damage', category: CATEGORY.EFFECT } },
    { data: { id: 'RESTORE_HP_EFFECT', label: 'Restore HP', category: CATEGORY.EFFECT } },
    { data: { id: 'DESTROY_CREATURE', label: 'Destroy Creature', category: CATEGORY.TERMINAL } },
    { data: { id: 'CHECK_WIN_CONDITION', label: 'Check Win', category: CATEGORY.TERMINAL } }
]

const EDGES = [
    { data: { source: 'START_GAME', target: 'DRAW_CARDS', label: 'DRAW_CARDS', conditional: false } },
    { data: { source: 'START_TURN', target: 'DRAW_CARDS', label: 'DRAW_CARDS', conditional: false } },
    { data: { source: 'DRAW_CARDS', target: 'CHECK_WIN_CONDITION', label: 'deck empty', conditional: true } },
    { data: { source: 'PLAY_SPELL', target: 'DEAL_DAMAGE_EFFECT', label: 'RESOLVE_DEAL_DAMAGE', conditional: false } },
    { data: { source: 'PLAY_SPELL', target: 'RESTORE_HP_EFFECT', label: 'RESOLVE_RESTORE_HP', conditional: false } },
    { data: { source: 'ATTACK', target: 'DESTROY_CREATURE', label: 'hp ≤ 0', conditional: true } },
    { data: { source: 'ATTACK', target: 'CHECK_WIN_CONDITION', label: 'player attack', conditional: false } },
    { data: { source: 'END_TURN', target: 'START_TURN', label: 'START_TURN_INTENT', conditional: false } },
    { data: { source: 'DEAL_DAMAGE_EFFECT', target: 'DESTROY_CREATURE', label: 'hp ≤ 0', conditional: true } },
    { data: { source: 'DEAL_DAMAGE_EFFECT', target: 'CHECK_WIN_CONDITION', label: 'player damage', conditional: false } }
]

export { NODES, EDGES, CATEGORY }
