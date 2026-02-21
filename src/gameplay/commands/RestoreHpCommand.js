/**
 * RestoreHpCommand — restaure des HP à un héro (cap à maxHp).
 *
 * Résout l'effet RESTORE_HP du sort Heal.
 */

export default class RestoreHpCommand {
    static type = 'RESTORE_HP_EFFECT'
    static category = 'effect'
    static edges = []

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

    apply(state) {
        const { targetId, amount } = this.payload
        const hero = state.heroes[targetId]
        const currentHp = hero.attributes.hp
        const maxHp = hero.attributes.maxHp || currentHp
        const newHp = Math.min(currentHp + amount, maxHp)

        return {
            patches: [{
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: newHp }
            }],
            domainEvents: [{
                type: 'HP_RESTORED',
                payload: { heroId: targetId, amount: newHp - currentHp },
                sourceCommandType: 'RESTORE_HP_EFFECT'
            }],
            intents: []
        }
    }
}
