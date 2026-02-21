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

        if (attacker.attributes.hasActed) {
            return { valid: false, reason: 'Already acted this turn' }
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
        const attackerArmor = state.heroes[attackerId].attributes.armor || 0
        const targetArmor = state.heroes[targetId].attributes.armor || 0

        // Marquer l'attaquant comme ayant agi
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: attackerId,
            payload: { key: 'hasActed', value: true }
        })

        // Dégâts mutuels (réduits par l'armure)
        const damageToTarget = Math.max(0, attackerPower - targetArmor)
        const damageToAttacker = Math.max(0, targetPower - attackerArmor)
        const newAttackerHp = attackerHp - damageToAttacker
        const newTargetHp = targetHp - damageToTarget

        patches.push(
            { type: 'SET_ATTRIBUTE', target: attackerId, payload: { key: 'hp', value: newAttackerHp } },
            { type: 'SET_ATTRIBUTE', target: targetId, payload: { key: 'hp', value: newTargetHp } }
        )

        domainEvents.push({
            type: 'COMBAT_RESOLVED',
            payload: { attackerId, targetId, attackerDamage: damageToTarget, targetDamage: damageToAttacker },
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
