/**
 * RestoreHpCommand — restaure des HP au joueur (max 20).
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
        const { playerId } = this.payload
        if (!state.players[playerId]) {
            return { valid: false, reason: `Player "${playerId}" not found` }
        }
        return { valid: true }
    }

    apply(state) {
        const { playerId, amount } = this.payload
        const currentHp = state.players[playerId].attributes.hp
        const newHp = Math.min(currentHp + amount, 20)

        return {
            patches: [{
                type: 'SET_ATTRIBUTE',
                target: playerId,
                payload: { key: 'hp', value: newHp }
            }],
            domainEvents: [{
                type: 'HP_RESTORED',
                payload: { playerId, amount: newHp - currentHp },
                sourceCommandType: 'RESTORE_HP_EFFECT'
            }],
            intents: []
        }
    }
}
