/**
 * AttackCommand — une créature attaque une cible.
 *
 * Cible = créature adverse OU joueur adverse.
 * - Créature vs créature : dégâts mutuels, mort à 0 hp.
 * - Créature vs joueur : joueur perd HP = power de l'attaquant.
 */

import { CardType } from '../definitions/cards.js'

export default class AttackCommand {
    static type = 'ATTACK'

    constructor(payload) {
        this.payload = payload
    }

    validate(state, _ctx) {
        const { playerId, attackerId, targetId } = this.payload

        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }

        // Vérifier l'attaquant
        const attacker = state.cards[attackerId]
        if (!attacker) {
            return { valid: false, reason: `Attacker "${attackerId}" not found` }
        }

        if (attacker.ownerId !== playerId) {
            return { valid: false, reason: 'Not your creature' }
        }

        if (attacker.zoneId !== `board_${playerId}`) {
            return { valid: false, reason: 'Attacker not on board' }
        }

        if (attacker.attributes.type !== CardType.CREATURE) {
            return { valid: false, reason: 'Not a creature' }
        }

        if (attacker.attributes.summoningSickness) {
            return { valid: false, reason: 'Summoning sickness' }
        }

        if (attacker.attributes.hasAttacked) {
            return { valid: false, reason: 'Already attacked this turn' }
        }

        // Vérifier la cible
        const targetPlayer = state.players[targetId]
        const targetCard = state.cards[targetId]

        if (!targetPlayer && !targetCard) {
            return { valid: false, reason: `Target "${targetId}" not found` }
        }

        if (targetPlayer && targetId === playerId) {
            return { valid: false, reason: 'Cannot attack yourself' }
        }

        if (targetCard) {
            if (targetCard.ownerId === playerId) {
                return { valid: false, reason: 'Cannot attack own creature' }
            }
            const opponentId = Object.keys(state.players).find(id => id !== playerId)
            if (targetCard.zoneId !== `board_${opponentId}`) {
                return { valid: false, reason: 'Target not on opponent board' }
            }
        }

        return { valid: true }
    }

    apply(state, ctx) {
        const { attackerId, targetId } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const attackerPower = ctx.query.query(attackerId, 'power')

        // Marquer l'attaquant comme ayant attaqué
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: attackerId,
            payload: { key: 'hasAttacked', value: true }
        })

        const targetPlayer = state.players[targetId]

        if (targetPlayer) {
            // Attaque directe sur joueur
            const currentHp = targetPlayer.attributes.hp
            patches.push({
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: currentHp - attackerPower }
            })

            domainEvents.push({
                type: 'PLAYER_DAMAGED',
                payload: { playerId: targetId, amount: attackerPower, sourceId: attackerId },
                sourceCommandType: 'ATTACK'
            })

            // Vérifier victoire
            intents.push({
                type: 'CHECK_WIN_CONDITION',
                payload: { reason: 'hp_zero', loserId: targetId },
                source: 'ATTACK'
            })
        } else {
            // Combat créature vs créature
            const targetCard = state.cards[targetId]
            const targetPower = ctx.query.query(targetId, 'power')
            const attackerHp = ctx.query.query(attackerId, 'hp')
            const targetHp = ctx.query.query(targetId, 'hp')

            // Dégâts mutuels
            const newAttackerHp = attackerHp - targetPower
            const newTargetHp = targetHp - attackerPower

            patches.push(
                { type: 'SET_ATTRIBUTE', target: attackerId, payload: { key: 'hp', value: newAttackerHp } },
                { type: 'SET_ATTRIBUTE', target: targetId, payload: { key: 'hp', value: newTargetHp } }
            )

            domainEvents.push({
                type: 'COMBAT_RESOLVED',
                payload: { attackerId, targetId, attackerDamage: attackerPower, targetDamage: targetPower },
                sourceCommandType: 'ATTACK'
            })

            // Vérifier les morts
            if (newAttackerHp <= 0) {
                intents.push({
                    type: 'DESTROY_CREATURE',
                    payload: { cardId: attackerId, ownerId: state.cards[attackerId].ownerId },
                    source: 'ATTACK'
                })
            }

            if (newTargetHp <= 0) {
                intents.push({
                    type: 'DESTROY_CREATURE',
                    payload: { cardId: targetId, ownerId: targetCard.ownerId },
                    source: 'ATTACK'
                })
            }
        }

        domainEvents.push({
            type: 'ATTACK_DECLARED',
            payload: { attackerId, targetId },
            sourceCommandType: 'ATTACK'
        })

        return { patches, domainEvents, intents }
    }
}
