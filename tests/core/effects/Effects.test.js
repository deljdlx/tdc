/**
 * Tests Effect System — TriggerEngine, ReplacementPipeline, Resolver, ChoiceSystem.
 * Intégration avec l'Engine.
 */

import { describe, it, expect } from 'vitest'
import Engine from '../../../src/core/engine/Engine.js'
import TriggerEngine from '../../../src/core/effects/TriggerEngine.js'
import ReplacementPipeline from '../../../src/core/effects/ReplacementPipeline.js'
import Resolver from '../../../src/core/effects/Resolver.js'
import ChoiceSystem from '../../../src/core/effects/ChoiceSystem.js'

// =====================
// COMMANDS DE TEST
// =====================

class DealDamageCommand {
    static type = 'DEAL_DAMAGE'
    constructor(payload) { this.payload = payload }
    validate() { return { valid: true } }
    apply(state) {
        const { targetId, amount } = this.payload
        const current = state.players[targetId]?.attributes.hp ?? 0
        return {
            patches: [{
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: current - amount }
            }],
            domainEvents: [{
                type: 'DAMAGE_DEALT',
                payload: { targetId, amount },
                sourceCommandType: 'DEAL_DAMAGE'
            }],
            intents: []
        }
    }
}

class HealCommand {
    static type = 'HEAL'
    constructor(payload) { this.payload = payload }
    validate() { return { valid: true } }
    apply(state) {
        const { targetId, amount } = this.payload
        const current = state.players[targetId]?.attributes.hp ?? 0
        return {
            patches: [{
                type: 'SET_ATTRIBUTE',
                target: targetId,
                payload: { key: 'hp', value: current + amount }
            }],
            domainEvents: [{
                type: 'HP_RESTORED',
                payload: { targetId, amount },
                sourceCommandType: 'HEAL'
            }],
            intents: []
        }
    }
}

class NoOpCommand {
    static type = 'NOOP'
    constructor(payload) { this.payload = payload }
    validate() { return { valid: true } }
    apply() {
        return {
            patches: [],
            domainEvents: [{ type: 'NOOP_EXECUTED', payload: {}, sourceCommandType: 'NOOP' }],
            intents: []
        }
    }
}

function createEngine() {
    const engine = new Engine({ seed: 42 })
    engine.commandRegistry.register(DealDamageCommand)
    engine.commandRegistry.register(HealCommand)
    engine.commandRegistry.register(NoOpCommand)
    engine.initialize({
        players: {
            p1: { id: 'p1', name: 'Alice', attributes: { hp: 20 } },
            p2: { id: 'p2', name: 'Bob', attributes: { hp: 20 } }
        },
        cards: {},
        zones: {},
        turnState: { activePlayerId: 'p1', turnNumber: 1, phase: 'main' }
    })
    return engine
}

// =====================
// TRIGGER ENGINE
// =====================

describe('TriggerEngine', () => {

    it('should generate intents from matching events', () => {
        const trigger = new TriggerEngine()

        trigger.register({
            id: 'on_damage_heal',
            eventType: 'DAMAGE_DEALT',
            condition: (event) => event.payload.amount >= 3,
            createIntent: (event) => ({
                type: 'DO_HEAL',
                payload: { targetId: event.payload.targetId, amount: 1 },
                source: 'on_damage_heal'
            })
        })

        trigger.processBatch([
            { type: 'DAMAGE_DEALT', payload: { targetId: 'p1', amount: 5 } }
        ], {})

        const intents = trigger.flush()
        expect(intents).toHaveLength(1)
        expect(intents[0].type).toBe('DO_HEAL')
    })

    it('should not trigger if condition is false', () => {
        const trigger = new TriggerEngine()

        trigger.register({
            id: 'big_damage_only',
            eventType: 'DAMAGE_DEALT',
            condition: (event) => event.payload.amount >= 10,
            createIntent: () => ({ type: 'TRIGGERED', payload: {}, source: 'test' })
        })

        trigger.processBatch([
            { type: 'DAMAGE_DEALT', payload: { targetId: 'p1', amount: 3 } }
        ], {})

        expect(trigger.flush()).toHaveLength(0)
    })

    it('should integrate with Engine step', () => {
        const engine = createEngine()

        // Quand des dégâts sont infligés, trigger un heal de 1
        engine.triggerEngine.register({
            id: 'regen',
            eventType: 'DAMAGE_DEALT',
            condition: () => true,
            createIntent: (event) => ({
                type: 'DO_HEAL',
                payload: { targetId: event.payload.targetId, amount: 1 },
                source: 'regen'
            })
        })

        engine.intentResolver.register('DO_HEAL', (intent) => {
            return new HealCommand(intent.payload)
        })

        engine.enqueueCommand(new DealDamageCommand({ targetId: 'p1', amount: 5 }))
        engine.runUntilIdle()

        // 20 - 5 + 1 = 16
        expect(engine.state.players.p1.attributes.hp).toBe(16)
    })
})

// =====================
// REPLACEMENT PIPELINE
// =====================

describe('ReplacementPipeline', () => {

    it('should transform command result', () => {
        const pipeline = new ReplacementPipeline()

        pipeline.register({
            id: 'halve_damage',
            priority: 1,
            condition: (commandType) => commandType === 'DEAL_DAMAGE',
            apply: (result) => ({
                ...result,
                patches: result.patches.map(p => ({
                    ...p,
                    payload: { ...p.payload, value: p.payload.value + 2 }
                }))
            })
        })

        const result = pipeline.process('DEAL_DAMAGE', {
            patches: [{ type: 'SET_ATTRIBUTE', target: 'p1', payload: { key: 'hp', value: 15 } }],
            domainEvents: [],
            intents: []
        }, {})

        expect(result.replaced).toBe(true)
        expect(result.result.patches[0].payload.value).toBe(17)
    })

    it('should VETO a command (return null)', () => {
        const pipeline = new ReplacementPipeline()

        pipeline.register({
            id: 'immune',
            priority: 1,
            condition: (commandType) => commandType === 'DEAL_DAMAGE',
            apply: () => null
        })

        const result = pipeline.process('DEAL_DAMAGE', {
            patches: [], domainEvents: [], intents: []
        }, {})

        expect(result.replaced).toBe(true)
        expect(result.result).toBeNull()
    })

    it('should apply first matching replacement only', () => {
        const pipeline = new ReplacementPipeline()
        let secondCalled = false

        pipeline.register({
            id: 'first',
            priority: 1,
            condition: () => true,
            apply: (result) => result
        })

        pipeline.register({
            id: 'second',
            priority: 2,
            condition: () => true,
            apply: (result) => { secondCalled = true; return result }
        })

        pipeline.process('DEAL_DAMAGE', { patches: [], domainEvents: [], intents: [] }, {})
        expect(secondCalled).toBe(false)
    })

    it('should integrate VETO with Engine', () => {
        const engine = createEngine()
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.replacementPipeline.register({
            id: 'immune_p1',
            priority: 1,
            condition: (type, result) => {
                return type === 'DEAL_DAMAGE' &&
                    result.domainEvents.some(e => e.payload.targetId === 'p1')
            },
            apply: () => null
        })

        engine.enqueueCommand(new DealDamageCommand({ targetId: 'p1', amount: 10 }))
        engine.runUntilIdle()

        // Les dégâts ont été annulés
        expect(engine.state.players.p1.attributes.hp).toBe(20)
        expect(events.some(e => e.type === 'COMMAND_VETOED')).toBe(true)
    })
})

// =====================
// RESOLVER
// =====================

describe('Resolver', () => {

    it('should order by priority then insertion order', () => {
        const resolver = new Resolver()

        resolver.enqueue([
            { type: 'LOW', priority: 10, payload: {} },
            { type: 'HIGH', priority: 1, payload: {} },
            { type: 'MED', priority: 5, payload: {} }
        ])

        expect(resolver.next().type).toBe('HIGH')
        expect(resolver.next().type).toBe('MED')
        expect(resolver.next().type).toBe('LOW')
    })

    it('should preserve FIFO within same priority', () => {
        const resolver = new Resolver()

        resolver.enqueue([
            { type: 'A', priority: 1, payload: {} },
            { type: 'B', priority: 1, payload: {} },
            { type: 'C', priority: 1, payload: {} }
        ])

        expect(resolver.next().type).toBe('A')
        expect(resolver.next().type).toBe('B')
        expect(resolver.next().type).toBe('C')
    })

    it('should return null when empty', () => {
        const resolver = new Resolver()
        expect(resolver.next()).toBeNull()
    })
})

// =====================
// CHOICE SYSTEM
// =====================

describe('ChoiceSystem', () => {

    it('should register and resolve a pending choice', () => {
        const cs = new ChoiceSystem()

        const choiceId = cs.requestChoice({
            playerId: 'p1',
            selector: { type: 'TARGET_ENTITY', filter: { zone: 'board' } },
            source: 'FIREBALL'
        })

        expect(cs.hasPendingChoice).toBe(true)
        expect(cs.pendingChoice.choiceId).toBe(choiceId)

        const { resolved, choice } = cs.provideChoice(choiceId, 'c3')

        expect(resolved).toBe(true)
        expect(choice.selection).toBe('c3')
        expect(cs.hasPendingChoice).toBe(false)
    })

    it('should reject mismatched choiceId', () => {
        const cs = new ChoiceSystem()
        cs.requestChoice({ playerId: 'p1', selector: {}, source: 'test' })

        const { resolved } = cs.provideChoice('wrong_id', 'value')
        expect(resolved).toBe(false)
    })
})

// =====================
// DETERMINISM (multi-effects)
// =====================

describe('Determinism with effects', () => {

    it('should produce identical state with triggers across two runs', () => {
        const run = () => {
            const engine = createEngine()

            engine.triggerEngine.register({
                id: 'regen',
                eventType: 'DAMAGE_DEALT',
                condition: () => true,
                createIntent: (event) => ({
                    type: 'DO_HEAL',
                    payload: { targetId: event.payload.targetId, amount: 2 },
                    source: 'regen'
                })
            })

            engine.intentResolver.register('DO_HEAL', (intent) => {
                return new HealCommand(intent.payload)
            })

            engine.enqueueCommand(new DealDamageCommand({ targetId: 'p1', amount: 5 }))
            engine.enqueueCommand(new DealDamageCommand({ targetId: 'p2', amount: 3 }))
            engine.runUntilIdle()

            return engine.getViewHash()
        }

        expect(run()).toBe(run())
    })

    it('should replay identically with effects', () => {
        const engine1 = createEngine()

        engine1.triggerEngine.register({
            id: 'regen',
            eventType: 'DAMAGE_DEALT',
            condition: () => true,
            createIntent: (event) => ({
                type: 'DO_HEAL',
                payload: { targetId: event.payload.targetId, amount: 1 },
                source: 'regen'
            })
        })

        engine1.intentResolver.register('DO_HEAL', (intent) => {
            return new HealCommand(intent.payload)
        })

        engine1.enqueueCommand(new DealDamageCommand({ targetId: 'p1', amount: 5 }))
        engine1.runUntilIdle()

        const hash1 = engine1.getViewHash()
        const replay = engine1.exportReplay()

        // Replay
        const engine2 = new Engine({ seed: 0 })
        engine2.commandRegistry.register(DealDamageCommand)
        engine2.commandRegistry.register(HealCommand)
        engine2.commandRegistry.register(NoOpCommand)

        engine2.triggerEngine.register({
            id: 'regen',
            eventType: 'DAMAGE_DEALT',
            condition: () => true,
            createIntent: (event) => ({
                type: 'DO_HEAL',
                payload: { targetId: event.payload.targetId, amount: 1 },
                source: 'regen'
            })
        })

        engine2.intentResolver.register('DO_HEAL', (intent) => {
            return new HealCommand(intent.payload)
        })

        engine2.importReplay(replay)
        engine2.runUntilIdle()

        expect(engine2.getViewHash()).toBe(hash1)
    })
})
