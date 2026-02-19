/**
 * PlayCreatureCommand — joue une créature depuis la main vers le board.
 *
 * Vérifie : mana suffisant, board pas plein, carte en main, type creature.
 * La créature arrive avec summoning sickness (ne peut pas attaquer ce tour).
 */

import { CardType } from '../definitions/cards.js'

export default class PlayCreatureCommand {
    static type = 'PLAY_CREATURE'

    constructor(payload) {
        this.payload = payload
    }

    validate(state, ctx) {
        const { playerId, cardId } = this.payload

        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }

        const card = state.cards[cardId]
        if (!card) {
            return { valid: false, reason: `Card "${cardId}" not found` }
        }

        if (card.ownerId !== playerId) {
            return { valid: false, reason: 'Not your card' }
        }

        if (card.zoneId !== `hand_${playerId}`) {
            return { valid: false, reason: 'Card not in hand' }
        }

        if (card.attributes.type !== CardType.CREATURE) {
            return { valid: false, reason: 'Not a creature' }
        }

        const player = state.players[playerId]
        const manaCost = ctx.query.query(cardId, 'cost')
        if (player.attributes.mana < manaCost) {
            return { valid: false, reason: 'Not enough mana' }
        }

        const boardCards = ctx.query.getCardsInZone(`board_${playerId}`)
        if (boardCards.length >= 5) {
            return { valid: false, reason: 'Board is full' }
        }

        return { valid: true }
    }

    apply(state, ctx) {
        const { playerId, cardId } = this.payload
        const patches = []

        const manaCost = ctx.query.query(cardId, 'cost')
        const currentMana = state.players[playerId].attributes.mana

        // Payer le mana
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: playerId,
            payload: { key: 'mana', value: currentMana - manaCost }
        })

        // Déplacer hand → board
        patches.push({
            type: 'MOVE_CARD',
            target: cardId,
            payload: { fromZoneId: `hand_${playerId}`, toZoneId: `board_${playerId}` }
        })

        // Summoning sickness
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: cardId,
            payload: { key: 'summoningSickness', value: true }
        })

        return {
            patches,
            domainEvents: [{
                type: 'CREATURE_PLAYED',
                payload: { cardId, playerId },
                sourceCommandType: 'PLAY_CREATURE'
            }],
            intents: []
        }
    }
}
