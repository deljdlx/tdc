/**
 * Tests DomainEventBus — batch, listeners, historique.
 */

import { describe, it, expect } from 'vitest'
import DomainEventBus from '../../../src/core/events/DomainEventBus.js'

describe('DomainEventBus', () => {

    it('should accumulate events in current batch', () => {
        const bus = new DomainEventBus()

        bus.emit({ type: 'CARD_PLAYED', payload: { cardId: 'c1' } })
        bus.emit({ type: 'DAMAGE_DEALT', payload: { amount: 3 } })

        expect(bus.currentBatch).toHaveLength(2)
    })

    it('should flush batch and notify listeners', () => {
        const bus = new DomainEventBus()
        const received = []

        bus.on(batch => received.push(...batch))

        bus.emit({ type: 'CARD_DRAWN', payload: {} })
        bus.flush()

        expect(received).toHaveLength(1)
        expect(received[0].type).toBe('CARD_DRAWN')
    })

    it('should clear current batch after flush', () => {
        const bus = new DomainEventBus()

        bus.emit({ type: 'A', payload: {} })
        bus.flush()

        expect(bus.currentBatch).toHaveLength(0)
    })

    it('should keep history of flushed batches', () => {
        const bus = new DomainEventBus()

        bus.emit({ type: 'A', payload: {} })
        bus.flush()

        bus.emit({ type: 'B', payload: {} })
        bus.emit({ type: 'C', payload: {} })
        bus.flush()

        expect(bus.history).toHaveLength(2)
        expect(bus.history[0]).toHaveLength(1)
        expect(bus.history[1]).toHaveLength(2)
    })

    it('should not flush empty batches', () => {
        const bus = new DomainEventBus()
        const received = []

        bus.on(batch => received.push(batch))
        bus.flush()

        expect(received).toHaveLength(0)
        expect(bus.history).toHaveLength(0)
    })

    it('should support unsubscribe', () => {
        const bus = new DomainEventBus()
        const received = []

        const unsub = bus.on(batch => received.push(batch))
        bus.emit({ type: 'A', payload: {} })
        bus.flush()

        unsub()

        bus.emit({ type: 'B', payload: {} })
        bus.flush()

        expect(received).toHaveLength(1)
    })
})
