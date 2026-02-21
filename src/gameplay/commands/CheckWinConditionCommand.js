/**
 * CheckWinConditionCommand — vérifie si un joueur a perdu.
 *
 * Conditions de défaite :
 * - HP ≤ 0
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
        const player = state.players[loserId]

        if (!player) {
            return { patches: [], domainEvents: [], intents: [] }
        }

        // Vérifier si la condition de défaite est effective
        let hasLost = false

        if (reason === 'hp_zero' && player.attributes.hp <= 0) {
            hasLost = true
        }

        if (reason === 'deck_empty') {
            hasLost = true
        }

        if (!hasLost) {
            return { patches: [], domainEvents: [], intents: [] }
        }

        // Trouver le gagnant
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
