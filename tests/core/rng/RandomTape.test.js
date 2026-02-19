/**
 * Tests RandomTape — déterminisme et replay du RNG.
 */

import { describe, it, expect } from 'vitest'
import RandomTape from '../../../src/core/rng/RandomTape.js'

describe('RandomTape', () => {

    it('should produce deterministic values with same seed', () => {
        const tape1 = new RandomTape({ seed: 123 })
        const tape2 = new RandomTape({ seed: 123 })

        const values1 = [tape1.next(), tape1.next(), tape1.next()]
        const values2 = [tape2.next(), tape2.next(), tape2.next()]

        expect(values1).toEqual(values2)
    })

    it('should produce different values with different seeds', () => {
        const tape1 = new RandomTape({ seed: 1 })
        const tape2 = new RandomTape({ seed: 2 })

        expect(tape1.next()).not.toBe(tape2.next())
    })

    it('should produce values in [0, 1)', () => {
        const tape = new RandomTape({ seed: 42 })

        for (let i = 0; i < 100; i++) {
            const v = tape.next()
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThan(1)
        }
    })

    it('should record tape in record mode', () => {
        const tape = new RandomTape({ seed: 7 })
        tape.next()
        tape.next()
        tape.next()

        expect(tape.tape).toHaveLength(3)
        expect(tape.index).toBe(3)
        expect(tape.replayMode).toBe(false)
    })

    it('should replay from pre-recorded tape', () => {
        // Enregistrer
        const recorder = new RandomTape({ seed: 99 })
        const v1 = recorder.next()
        const v2 = recorder.next()
        const v3 = recorder.next()

        // Rejouer
        const replayer = new RandomTape({ seed: 0, tape: recorder.tape })
        expect(replayer.replayMode).toBe(true)
        expect(replayer.next()).toBe(v1)
        expect(replayer.next()).toBe(v2)
        expect(replayer.next()).toBe(v3)
    })

    it('should throw when replay tape is exhausted', () => {
        const replayer = new RandomTape({ seed: 0, tape: [0.5] })
        replayer.next() // OK

        expect(() => replayer.next()).toThrow('tape exhausted')
    })

    it('should produce integers in range with nextInt', () => {
        const tape = new RandomTape({ seed: 42 })

        for (let i = 0; i < 100; i++) {
            const v = tape.nextInt(1, 6)
            expect(v).toBeGreaterThanOrEqual(1)
            expect(v).toBeLessThanOrEqual(6)
            expect(Number.isInteger(v)).toBe(true)
        }
    })

    it('nextInt should replay deterministically', () => {
        const recorder = new RandomTape({ seed: 55 })
        const rolls = [recorder.nextInt(1, 6), recorder.nextInt(1, 6), recorder.nextInt(1, 6)]

        const replayer = new RandomTape({ seed: 0, tape: recorder.tape })
        const replayed = [replayer.nextInt(1, 6), replayer.nextInt(1, 6), replayer.nextInt(1, 6)]

        expect(replayed).toEqual(rolls)
    })
})
