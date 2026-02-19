/**
 * DrawCardsCommand — pioche N cartes du deck vers la main.
 *
 * Si le deck est vide → le joueur perd (fatigue = défaite).
 * Si la main est pleine (10) → la carte va au graveyard.
 */

export default class DrawCardsCommand {
    static type = 'DRAW_CARDS'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId } = this.payload
        if (!state.players[playerId]) {
            return { valid: false, reason: `Player "${playerId}" not found` }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const { playerId, count } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const deckId = `deck_${playerId}`
        const handId = `hand_${playerId}`
        const graveyardId = `graveyard_${playerId}`

        const deckCards = ctx.query.getCardsInZone(deckId)
        const handCards = ctx.query.getCardsInZone(handId)

        let handSize = handCards.length

        for (let i = 0; i < count; i++) {
            if (deckCards.length - i <= 0) {
                // Deck vide → fatigue (défaite)
                domainEvents.push({
                    type: 'DECK_EMPTY',
                    payload: { playerId },
                    sourceCommandType: 'DRAW_CARDS'
                })
                intents.push({
                    type: 'CHECK_WIN_CONDITION',
                    payload: { reason: 'deck_empty', loserId: playerId },
                    source: 'DRAW_CARDS'
                })
                break
            }

            const card = deckCards[i]

            if (handSize >= 10) {
                // Main pleine → graveyard
                patches.push({
                    type: 'MOVE_CARD',
                    target: card.id,
                    payload: { fromZoneId: deckId, toZoneId: graveyardId }
                })
                domainEvents.push({
                    type: 'CARD_BURNED',
                    payload: { cardId: card.id, playerId },
                    sourceCommandType: 'DRAW_CARDS'
                })
            } else {
                // Pioche normale
                patches.push({
                    type: 'MOVE_CARD',
                    target: card.id,
                    payload: { fromZoneId: deckId, toZoneId: handId }
                })
                domainEvents.push({
                    type: 'CARD_DRAWN',
                    payload: { cardId: card.id, playerId },
                    sourceCommandType: 'DRAW_CARDS'
                })
                handSize++
            }
        }

        return { patches, domainEvents, intents }
    }
}
