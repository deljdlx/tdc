/**
 * AttackCommand — un héro attaque un héro adverse.
 *
 * Dégâts mutuels selon la puissance de chaque héro.
 * Si HP ≤ 0, le héro est détruit via DESTROY_HERO.
 */

export default class AttackCommand {
    static type = 'ATTACK'
    static category = 'player_action'
    static edges = [
        { target: 'DESTROY_HERO', label: 'hp ≤ 0', conditional: true }
    ]

    constructor(payload) {
        this.payload = payload
    }

    validate(state, _ctx) {
        const { playerId, attackerId, targetId } = this.payload

        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }

        const attacker = state.heroes[attackerId]
        if (!attacker) {
            return { valid: false, reason: `Attacker "${attackerId}" not found` }
        }

        if (attacker.playerId !== playerId) {
            return { valid: false, reason: 'Not your hero' }
        }

        if (attacker.attributes.hasAttacked) {
            return { valid: false, reason: 'Already attacked this turn' }
        }

        const target = state.heroes[targetId]
        if (!target) {
            return { valid: false, reason: `Target "${targetId}" not found` }
        }

        if (target.playerId === playerId) {
            return { valid: false, reason: 'Cannot attack own hero' }
        }

        return { valid: true }
    }

    apply(state, ctx) {
        const { attackerId, targetId } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const attackerPower = ctx.query.query(attackerId, 'power')
        const targetPower = ctx.query.query(targetId, 'power')
        const attackerHp = ctx.query.query(attackerId, 'hp')
        const targetHp = ctx.query.query(targetId, 'hp')

        // Marquer l'attaquant comme ayant attaqué
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: attackerId,
            payload: { key: 'hasAttacked', value: true }
        })

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
                type: 'DESTROY_HERO',
                payload: { heroId: attackerId, playerId: state.heroes[attackerId].playerId },
                source: 'ATTACK'
            })
        }

        if (newTargetHp <= 0) {
            intents.push({
                type: 'DESTROY_HERO',
                payload: { heroId: targetId, playerId: state.heroes[targetId].playerId },
                source: 'ATTACK'
            })
        }

        domainEvents.push({
            type: 'ATTACK_DECLARED',
            payload: { attackerId, targetId },
            sourceCommandType: 'ATTACK'
        })

        return { patches, domainEvents, intents }
    }
}
