/**
 * UsePowerCommand — un hero utilise un pouvoir de sa classe.
 *
 * Deduit les AP, resout les effets via intents
 * (DEAL_DAMAGE, RESTORE_HP, APPLY_BUFF).
 * Les freeAction ne consomment pas l'action du tour.
 */

import { getPowerDefinition } from '../definitions/powers.js'

export default class UsePowerCommand {
    static type = 'USE_POWER'
    static category = 'player_action'
    static edges = [
        { target: 'DEAL_DAMAGE_EFFECT', label: 'damage', conditional: true },
        { target: 'RESTORE_HP_EFFECT', label: 'heal', conditional: true },
        { target: 'APPLY_BUFF_EFFECT', label: 'buff', conditional: true },
        { target: 'DESTROY_HERO', label: 'hp ≤ 0', conditional: true }
    ]

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId, heroId, powerId, targetId } = this.payload

        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }

        const hero = state.heroes[heroId]
        if (!hero) {
            return { valid: false, reason: `Hero "${heroId}" not found` }
        }

        if (hero.playerId !== playerId) {
            return { valid: false, reason: 'Not your hero' }
        }

        const power = getPowerDefinition(powerId)
        if (!power) {
            return { valid: false, reason: `Power "${powerId}" not found` }
        }

        if (power.heroClass !== hero.heroDefId) {
            return { valid: false, reason: `Power "${powerId}" not available for ${hero.heroDefId}` }
        }

        if ((hero.attributes.ap || 0) < power.apCost) {
            return { valid: false, reason: 'Not enough AP' }
        }

        if (!power.freeAction && hero.attributes.hasActed) {
            return { valid: false, reason: 'Already acted this turn' }
        }

        // Validate target
        if (power.targetType === 'enemy_hero') {
            if (!targetId) return { valid: false, reason: 'Target required' }
            const target = state.heroes[targetId]
            if (!target) return { valid: false, reason: `Target "${targetId}" not found` }
            if (target.playerId === playerId) return { valid: false, reason: 'Must target enemy hero' }
        } else if (power.targetType === 'ally_hero') {
            if (!targetId) return { valid: false, reason: 'Target required' }
            const target = state.heroes[targetId]
            if (!target) return { valid: false, reason: `Target "${targetId}" not found` }
            if (target.playerId !== playerId) return { valid: false, reason: 'Must target ally hero' }
        }
        // self and all_enemies don't need targetId validation

        return { valid: true }
    }

    apply(state, ctx) {
        const { heroId, powerId, targetId } = this.payload
        const hero = state.heroes[heroId]
        const power = getPowerDefinition(powerId)

        const patches = []
        const domainEvents = []
        const intents = []

        // Deduct AP
        patches.push({
            type: 'SET_ATTRIBUTE',
            target: heroId,
            payload: { key: 'ap', value: (hero.attributes.ap || 0) - power.apCost }
        })

        // Mark as acted (unless freeAction)
        if (!power.freeAction) {
            patches.push({
                type: 'SET_ATTRIBUTE',
                target: heroId,
                payload: { key: 'hasActed', value: true }
            })
        }

        // Resolve targets
        const targets = this._resolveTargets(state, hero, power, targetId)

        // Generate intents for each effect
        for (const effect of power.effects) {
            for (const tgtId of targets) {
                if (effect.type === 'DEAL_DAMAGE') {
                    const amount = this._resolveDamageAmount(effect, ctx, heroId)
                    intents.push({
                        type: 'RESOLVE_DEAL_DAMAGE',
                        payload: { targetId: tgtId, amount },
                        source: 'USE_POWER'
                    })
                } else if (effect.type === 'RESTORE_HP') {
                    intents.push({
                        type: 'RESOLVE_RESTORE_HP',
                        payload: { targetId: tgtId, amount: effect.amount },
                        source: 'USE_POWER'
                    })
                } else if (effect.type === 'APPLY_BUFF') {
                    const turnNumber = state.turnState.turnNumber
                    intents.push({
                        type: 'RESOLVE_APPLY_BUFF',
                        payload: {
                            targetId: tgtId,
                            attribute: effect.attribute,
                            delta: effect.delta,
                            expiresTurn: turnNumber + effect.duration
                        },
                        source: 'USE_POWER'
                    })
                }
            }
        }

        domainEvents.push({
            type: 'POWER_USED',
            payload: { heroId, powerId, targetId: targetId || null },
            sourceCommandType: 'USE_POWER'
        })

        return { patches, domainEvents, intents }
    }

    /**
     * Determine les cibles en fonction du targetType du pouvoir.
     */
    _resolveTargets(state, hero, power, targetId) {
        if (power.targetType === 'self') {
            return [hero.id]
        }
        if (power.targetType === 'all_enemies') {
            return Object.values(state.heroes)
                .filter(h => h.playerId !== hero.playerId)
                .map(h => h.id)
        }
        // enemy_hero or ally_hero
        return [targetId]
    }

    /**
     * Calcule le montant des degats selon la definition de l'effet.
     */
    _resolveDamageAmount(effect, ctx, heroId) {
        if (effect.amount === 'double_power') {
            return ctx.query.query(heroId, 'power') * 2
        }
        if (effect.attribute === 'power') {
            return ctx.query.query(heroId, 'power')
        }
        return effect.amount
    }
}
