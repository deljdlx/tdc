/**
 * StartTurnCommand — début d'un nouveau tour.
 *
 * - maxMana += 1 (cap à 10)
 * - mana courant = maxMana
 * - piocher 1 carte
 * - reset summoning sickness et hasAttacked des créatures du joueur actif
 */

export default class StartTurnCommand {
    static type = 'START_TURN'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId } = this.payload
        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: `Not ${playerId}'s turn` }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const { playerId } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const player = state.players[playerId]

        // Incrémenter mana (cap 10)
        const newMaxMana = Math.min((player.attributes.maxMana || 0) + 1, 10)
        patches.push(
            { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'maxMana', value: newMaxMana } },
            { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'mana', value: newMaxMana } }
        )

        // Reset hasAttacked et summoning sickness pour les créatures du joueur sur le board
        const boardCards = ctx.query.getCardsInZone(`board_${playerId}`)
        for (const card of boardCards) {
            patches.push(
                { type: 'SET_ATTRIBUTE', target: card.id, payload: { key: 'hasAttacked', value: false } },
                { type: 'SET_ATTRIBUTE', target: card.id, payload: { key: 'summoningSickness', value: false } }
            )
        }

        // Phase main
        patches.push({
            type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'phase', value: 'main' }
        })

        domainEvents.push({
            type: 'TURN_STARTED',
            payload: { playerId, turnNumber: state.turnState.turnNumber },
            sourceCommandType: 'START_TURN'
        })

        // Piocher 1 carte
        intents.push({
            type: 'DRAW_CARDS',
            payload: { playerId, count: 1 },
            source: 'START_TURN'
        })

        return { patches, domainEvents, intents }
    }
}
