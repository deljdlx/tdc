/**
 * PlaySpellCommand — joue un sort depuis la main.
 *
 * Paie le mana, résout l'effet via un intent, envoie au graveyard.
 * Si l'effet nécessite un choix (ex: FIREBALL), le choix est passé dans le payload.
 */

import { CardType } from '../definitions/cards.js'

export default class PlaySpellCommand {
    static type = 'PLAY_SPELL'

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

        if (card.attributes.type !== CardType.SPELL) {
            return { valid: false, reason: 'Not a spell' }
        }

        const manaCost = ctx.query.query(cardId, 'cost')
        if (state.players[playerId].attributes.mana < manaCost) {
            return { valid: false, reason: 'Not enough mana' }
        }

        return { valid: true }
    }

    apply(state, ctx) {
        const { playerId, cardId, targetId } = this.payload
        const patches = []
        const intents = []

        const card = state.cards[cardId]
        const manaCost = ctx.query.query(cardId, 'cost')
        const currentMana = state.players[playerId].attributes.mana

        // Payer le mana
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: playerId,
            payload: { key: 'mana', value: currentMana - manaCost }
        })

        // Déplacer hand → graveyard
        patches.push({
            type: 'MOVE_CARD',
            target: cardId,
            payload: { fromZoneId: `hand_${playerId}`, toZoneId: `graveyard_${playerId}` }
        })

        // Émettre l'intent pour résoudre l'effet
        const effect = card.attributes.effect
        const effectPayload = card.attributes.effectPayload
            ? JSON.parse(card.attributes.effectPayload)
            : {}

        intents.push({
            type: `RESOLVE_${effect}`,
            payload: { ...effectPayload, playerId, targetId },
            source: 'PLAY_SPELL'
        })

        return {
            patches,
            domainEvents: [{
                type: 'SPELL_PLAYED',
                payload: { cardId, playerId },
                sourceCommandType: 'PLAY_SPELL'
            }],
            intents
        }
    }
}
