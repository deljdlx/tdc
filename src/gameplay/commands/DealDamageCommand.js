/**
 * DealDamageCommand — inflige des dégâts à une cible (créature ou joueur).
 *
 * Résout l'effet DEAL_DAMAGE du sort Fireball.
 * Vérifie la mort de la créature / la défaite du joueur.
 */

export default class DealDamageCommand {
    static type = 'DEAL_DAMAGE_EFFECT'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { targetId } = this.payload
        if (!state.players[targetId] && !state.cards[targetId]) {
            return { valid: false, reason: `Target "${targetId}" not found` }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const { targetId, amount } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const targetPlayer = state.players[targetId]

        if (targetPlayer) {
            // Dégâts au joueur
            patches.push({
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: targetPlayer.attributes.hp - amount }
            })

            domainEvents.push({
                type: 'DAMAGE_DEALT',
                payload: { targetId, amount, targetType: 'player' },
                sourceCommandType: 'DEAL_DAMAGE_EFFECT'
            })

            intents.push({
                type: 'CHECK_WIN_CONDITION',
                payload: { reason: 'hp_zero', loserId: targetId },
                source: 'DEAL_DAMAGE_EFFECT'
            })
        } else {
            // Dégâts à une créature
            const currentHp = ctx.query.query(targetId, 'hp')
            const newHp = currentHp - amount

            patches.push({
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: newHp }
            })

            domainEvents.push({
                type: 'DAMAGE_DEALT',
                payload: { targetId, amount, targetType: 'creature' },
                sourceCommandType: 'DEAL_DAMAGE_EFFECT'
            })

            if (newHp <= 0) {
                const card = state.cards[targetId]
                intents.push({
                    type: 'DESTROY_CREATURE',
                    payload: { cardId: targetId, ownerId: card.ownerId },
                    source: 'DEAL_DAMAGE_EFFECT'
                })
            }
        }

        return { patches, domainEvents, intents }
    }
}
