/**
 * EndTurnCommand — termine le tour du joueur actif.
 *
 * Passe le tour à l'adversaire et émet un intent START_TURN.
 */

export default class EndTurnCommand {
    static type = 'END_TURN'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId } = this.payload
        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }
        return { valid: true }
    }

    apply(state) {
        const { playerId } = this.payload
        const playerIds = Object.keys(state.players)
        const nextPlayerId = playerIds.find(id => id !== playerId)

        const patches = [
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'activePlayerId', value: nextPlayerId } },
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'turnNumber', value: state.turnState.turnNumber + 1 } },
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'phase', value: 'start' } }
        ]

        return {
            patches,
            domainEvents: [{
                type: 'TURN_ENDED',
                payload: { playerId },
                sourceCommandType: 'END_TURN'
            }],
            intents: [{
                type: 'START_TURN_INTENT',
                payload: { playerId: nextPlayerId },
                source: 'END_TURN'
            }]
        }
    }
}
