/**
 * ApplyBuffCommand — applique un buff (ou debuff) a un hero.
 *
 * Modifie l'attribut cible par un delta et enregistre le buff
 * dans activeBuffs pour expiration automatique au debut du tour.
 */

export default class ApplyBuffCommand {
    static type = 'APPLY_BUFF_EFFECT'
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
        const { targetId, attribute, delta, expiresTurn } = this.payload
        const hero = state.heroes[targetId]

        const currentValue = hero.attributes[attribute] || 0
        const newValue = currentValue + delta

        // Enregistrer dans activeBuffs pour cleanup au debut du tour
        const buffs = JSON.parse(hero.attributes.activeBuffs || '[]')
        buffs.push({ attribute, delta, expiresTurn })

        const patches = [
            { type: 'SET_ATTRIBUTE', target: targetId, payload: { key: attribute, value: newValue } },
            { type: 'SET_ATTRIBUTE', target: targetId, payload: { key: 'activeBuffs', value: JSON.stringify(buffs) } }
        ]

        const domainEvents = [{
            type: 'BUFF_APPLIED',
            payload: { targetId, attribute, delta, expiresTurn },
            sourceCommandType: 'APPLY_BUFF_EFFECT'
        }]

        return { patches, domainEvents, intents: [] }
    }
}
