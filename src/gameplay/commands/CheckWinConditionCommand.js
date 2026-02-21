/**
 * CheckWinConditionCommand — vérifie si un joueur a perdu.
 *
 * Conditions de défaite :
 * - Tous les héros du joueur sont morts
 * - Deck vide au moment de piocher
 */

export default class CheckWinConditionCommand {
    static type = 'CHECK_WIN_CONDITION'
    static category = 'terminal'
    static edges = []

    constructor(payload) {
        this.payload = payload
    }

    validate() {
        return { valid: true }
    }

    apply(state) {
        const { loserId, reason } = this.payload

        if (!state.players[loserId]) {
            return { patches: [], domainEvents: [], intents: [] }
        }

        let hasLost = false

        if (reason === 'heroes_dead') {
            const remaining = Object.values(state.heroes || {})
                .filter(h => h.playerId === loserId)
            hasLost = remaining.length === 0
        }

        if (reason === 'deck_empty') {
            hasLost = true
        }

        if (!hasLost) {
            return { patches: [], domainEvents: [], intents: [] }
        }

        const winnerId = Object.keys(state.players).find(id => id !== loserId)

        return {
            patches: [
                { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'phase', value: 'game_over' } }
            ],
            domainEvents: [{
                type: 'GAME_OVER',
                payload: { winnerId, loserId, reason },
                sourceCommandType: 'CHECK_WIN_CONDITION'
            }],
            intents: []
        }
    }
}
