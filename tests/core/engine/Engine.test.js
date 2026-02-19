/**
 * Tests Engine — step, determinism, replay, cycle detection.
 *
 * Utilise des Commands de test minimales pour valider
 * le comportement du moteur sans gameplay réel.
 */

import { describe, it, expect } from 'vitest'
import Engine, { StepStatus } from '../../../src/core/engine/Engine.js'

// =====================
// COMMANDS DE TEST
// =====================

class IncrementHpCommand {
    static type = 'INCREMENT_HP'

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const player = state.players[this.payload.playerId]
        if (!player) {
            return { valid: false, reason: 'Player not found' }
        }
        return { valid: true }
    }

    apply(state) {
        const { playerId, amount } = this.payload
        return {
            patches: [{
                type: 'SET_ATTRIBUTE',
                target: playerId,
                payload: { key: 'hp', value: state.players[playerId].attributes.hp + amount }
            }],
            domainEvents: [{
                type: 'HP_INCREMENTED',
                payload: { playerId, amount },
                sourceCommandType: 'INCREMENT_HP'
            }],
            intents: []
        }
    }
}

class DrawCardCommand {
    static type = 'DRAW_CARD'

    constructor(payload) {
        this.payload = payload
    }

    validate() {
        return { valid: true }
    }

    apply(_state, ctx) {
        const roll = ctx.random.nextInt(1, 100)
        return {
            patches: [],
            domainEvents: [{
                type: 'CARD_DRAWN',
                payload: { playerId: this.payload.playerId, roll },
                sourceCommandType: 'DRAW_CARD'
            }],
            intents: []
        }
    }
}

class EmitIntentCommand {
    static type = 'EMIT_INTENT'

    constructor(payload) {
        this.payload = payload
    }

    validate() {
        return { valid: true }
    }

    apply() {
        return {
            patches: [],
            domainEvents: [{
                type: 'INTENT_EMITTED',
                payload: {},
                sourceCommandType: 'EMIT_INTENT'
            }],
            intents: [{
                type: 'DO_INCREMENT',
                payload: { playerId: 'p1', amount: 1 },
                source: 'EMIT_INTENT'
            }]
        }
    }
}

class InvalidCommand {
    static type = 'INVALID_CMD'

    constructor(payload) {
        this.payload = payload
    }

    validate() {
        return { valid: false, reason: 'Always invalid' }
    }

    apply() {
        return { patches: [], domainEvents: [], intents: [] }
    }
}

// =====================
// HELPERS
// =====================

function createEngine() {
    const engine = new Engine({ seed: 42 })

    engine.commandRegistry.register(IncrementHpCommand)
    engine.commandRegistry.register(DrawCardCommand)
    engine.commandRegistry.register(EmitIntentCommand)
    engine.commandRegistry.register(InvalidCommand)

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
// TESTS
// =====================

describe('Engine', () => {

    describe('step()', () => {

        it('should return IDLE when no commands queued', () => {
            const engine = createEngine()
            const result = engine.step()

            expect(result.status).toBe(StepStatus.IDLE)
        })

        it('should execute a command and apply patches', () => {
            const engine = createEngine()
            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 5 }))

            const result = engine.step()

            expect(result.status).toBe(StepStatus.IDLE)
            expect(engine.state.players.p1.attributes.hp).toBe(25)
        })

        it('should reject invalid commands', () => {
            const engine = createEngine()
            const events = []
            engine.domainEventBus.on(batch => events.push(...batch))

            engine.enqueueCommand(new InvalidCommand({}))
            engine.step()

            expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
        })

        it('should log rejected commands in CommandLog', () => {
            const engine = createEngine()
            engine.enqueueCommand(new InvalidCommand({}))
            engine.step()

            // La command rejetée est loggée
            const replay = engine.exportReplay()
            expect(replay.commandLog).toHaveLength(1)
            expect(replay.commandLog[0].type).toBe('INVALID_CMD')
        })

        it('should increment version after patches', () => {
            const engine = createEngine()
            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 1 }))
            engine.step()

            expect(engine.version).toBe(1)
            expect(engine.state.version).toBe(1)
        })
    })

    describe('intents', () => {

        it('should resolve intents into commands', () => {
            const engine = createEngine()

            engine.intentResolver.register('DO_INCREMENT', (intent) => {
                return new IncrementHpCommand(intent.payload)
            })

            engine.enqueueCommand(new EmitIntentCommand({}))

            // step 1 : exécute EmitIntentCommand → émet intent
            engine.step()
            expect(engine.state.players.p1.attributes.hp).toBe(20)

            // step 2 : résout l'intent → IncrementHpCommand
            engine.step()
            expect(engine.state.players.p1.attributes.hp).toBe(21)
        })
    })

    describe('runUntilIdle', () => {

        it('should run multiple steps until idle', () => {
            const engine = createEngine()

            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 1 }))
            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 2 }))
            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 3 }))

            const result = engine.runUntilIdle()

            expect(result.status).toBe(StepStatus.IDLE)
            expect(result.steps).toBe(3)
            expect(engine.state.players.p1.attributes.hp).toBe(26)
        })
    })

    describe('determinism', () => {

        it('should produce identical state with same seed and commands', () => {
            const run = () => {
                const engine = createEngine()
                engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 3 }))
                engine.enqueueCommand(new DrawCardCommand({ playerId: 'p1' }))
                engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p2', amount: -2 }))
                engine.runUntilIdle()
                return engine.getViewHash()
            }

            expect(run()).toBe(run())
        })

        it('should produce identical random values with same seed', () => {
            const run = () => {
                const engine = createEngine()
                engine.enqueueCommand(new DrawCardCommand({ playerId: 'p1' }))
                engine.enqueueCommand(new DrawCardCommand({ playerId: 'p1' }))
                engine.runUntilIdle()
                return engine.exportReplay().randomTape
            }

            expect(run()).toEqual(run())
        })
    })

    describe('replay', () => {

        it('should replay to identical state', () => {
            // Partie originale
            const engine1 = createEngine()

            engine1.intentResolver.register('DO_INCREMENT', (intent) => {
                return new IncrementHpCommand(intent.payload)
            })

            engine1.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 5 }))
            engine1.enqueueCommand(new DrawCardCommand({ playerId: 'p1' }))
            engine1.enqueueCommand(new InvalidCommand({}))
            engine1.runUntilIdle()

            const hash1 = engine1.getViewHash()
            const replay = engine1.exportReplay()

            // Replay
            const engine2 = new Engine({ seed: 0 })
            engine2.commandRegistry.register(IncrementHpCommand)
            engine2.commandRegistry.register(DrawCardCommand)
            engine2.commandRegistry.register(EmitIntentCommand)
            engine2.commandRegistry.register(InvalidCommand)

            engine2.intentResolver.register('DO_INCREMENT', (intent) => {
                return new IncrementHpCommand(intent.payload)
            })

            engine2.importReplay(replay)
            engine2.runUntilIdle()

            expect(engine2.getViewHash()).toBe(hash1)
        })
    })

    describe('pause policy', () => {

        it('should pause when policy triggers', () => {
            const engine = createEngine()

            engine.pausePolicy.addRule((batch) => {
                if (batch.some(e => e.type === 'HP_INCREMENTED')) {
                    return 'animate_hp'
                }
                return null
            })

            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 1 }))
            const result = engine.step()

            expect(result.status).toBe(StepStatus.PAUSED)
            expect(result.pauseHint).toBe('animate_hp')
        })
    })

    describe('cycle detection', () => {

        it('should detect repeated state fingerprint', () => {
            const engine = createEngine()

            // Deux commandes invalides produisent le même state
            engine.enqueueCommand(new InvalidCommand({}))
            engine.step()

            engine.enqueueCommand(new InvalidCommand({}))
            const result = engine.step()

            expect(result.status).toBe(StepStatus.CYCLE)
        })
    })

    describe('step granularity', () => {

        it('should execute exactly one command per step', () => {
            const engine = createEngine()
            const events = []
            engine.domainEventBus.on(batch => events.push(batch))

            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 1 }))
            engine.enqueueCommand(new IncrementHpCommand({ playerId: 'p1', amount: 2 }))

            engine.step()

            // Un seul batch, un seul event
            expect(events).toHaveLength(1)
            expect(engine.state.players.p1.attributes.hp).toBe(21)

            engine.step()

            expect(events).toHaveLength(2)
            expect(engine.state.players.p1.attributes.hp).toBe(23)
        })
    })
})
