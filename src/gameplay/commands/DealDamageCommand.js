/**
 * DealDamageCommand — inflige des dégâts à un héro.
 *
 * Résout l'effet DEAL_DAMAGE du sort Fireball.
 * Vérifie la mort du héro après les dégâts.
 */

export default class DealDamageCommand {
    static type = 'DEAL_DAMAGE_EFFECT'
    static category = 'effect'
    static edges = [
        { target: 'DESTROY_HERO', label: 'hp ≤ 0', conditional: true }
    ]

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { targetId } = this.payload
        if (!state.heroes?.[targetId]) {
            return { valid: false, reason: `Hero "${targetId}" not found` }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const { targetId, amount } = this.payload

        const currentHp = ctx.query.query(targetId, 'hp')
        const newHp = currentHp - amount

        const patches = [{
            type: 'SET_ATTRIBUTE',
            target: targetId,
            payload: { key: 'hp', value: newHp }
        }]

        const domainEvents = [{
            type: 'DAMAGE_DEALT',
            payload: { targetId, amount, targetType: 'hero' },
            sourceCommandType: 'DEAL_DAMAGE_EFFECT'
        }]

        const intents = []
        if (newHp <= 0) {
            intents.push({
                type: 'DESTROY_HERO',
                payload: { heroId: targetId, playerId: state.heroes[targetId].playerId },
                source: 'DEAL_DAMAGE_EFFECT'
            })
        }

        return { patches, domainEvents, intents }
    }
}
