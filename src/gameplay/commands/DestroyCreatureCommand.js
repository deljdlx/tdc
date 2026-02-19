/**
 * DestroyCreatureCommand — envoie une créature au graveyard.
 *
 * Appelé quand une créature tombe à 0 hp ou moins.
 */

export default class DestroyCreatureCommand {
    static type = 'DESTROY_CREATURE'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { cardId } = this.payload
        const card = state.cards[cardId]
        if (!card) {
            return { valid: false, reason: `Card "${cardId}" not found` }
        }
        return { valid: true }
    }

    apply(state) {
        const { cardId, ownerId } = this.payload
        const card = state.cards[cardId]

        return {
            patches: [{
                type: 'MOVE_CARD',
                target: cardId,
                payload: { fromZoneId: card.zoneId, toZoneId: `graveyard_${ownerId}` }
            }],
            domainEvents: [{
                type: 'CREATURE_DESTROYED',
                payload: { cardId, ownerId },
                sourceCommandType: 'DESTROY_CREATURE'
            }],
            intents: []
        }
    }
}
