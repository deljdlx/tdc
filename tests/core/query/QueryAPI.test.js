/**
 * Tests QueryAPI — lecture, modifiers, cache, visibilité.
 */

import { describe, it, expect } from 'vitest'
import QueryAPI from '../../../src/core/query/QueryAPI.js'

function makeZoneTypeRegistry() {
    const types = new Map()
    types.set('hand', { id: 'hand', ordered: true, visibility: 'owner', maxSize: null })
    types.set('board', { id: 'board', ordered: false, visibility: 'public', maxSize: 5 })
    types.set('deck', { id: 'deck', ordered: true, visibility: 'hidden', maxSize: null })
    return { get: (id) => types.get(id), has: (id) => types.has(id) }
}

function makeState(version = 1) {
    return {
        players: {
            p1: { id: 'p1', name: 'Alice', attributes: { hp: 20 } }
        },
        cards: {
            c1: { id: 'c1', definitionId: 'FIGHTER', ownerId: 'p1', zoneId: 'board_p1', attributes: { power: 2, hp: 3 }, visibilityOverride: null },
            c2: { id: 'c2', definitionId: 'ARCHER', ownerId: 'p1', zoneId: 'hand_p1', attributes: { power: 3, hp: 1 }, visibilityOverride: null },
            c3: { id: 'c3', definitionId: 'RECRUIT', ownerId: 'p1', zoneId: 'deck_p1', attributes: { power: 1, hp: 2 }, visibilityOverride: null }
        },
        zones: {
            board_p1: { id: 'board_p1', zoneTypeId: 'board', ownerId: 'p1' },
            hand_p1: { id: 'hand_p1', zoneTypeId: 'hand', ownerId: 'p1' },
            deck_p1: { id: 'deck_p1', zoneTypeId: 'deck', ownerId: 'p1' }
        },
        turnState: { activePlayerId: 'p1', turnNumber: 1, phase: 'main' },
        version
    }
}

describe('QueryAPI', () => {

    describe('query() base values', () => {

        it('should return base attribute value without modifiers', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            expect(api.query('c1', 'power')).toBe(2)
            expect(api.query('p1', 'hp')).toBe(20)
        })

        it('should return undefined for missing entity', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            expect(api.query('unknown', 'power')).toBeUndefined()
        })

        it('should return undefined for missing attribute', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            expect(api.query('c1', 'nonexistent')).toBeUndefined()
        })
    })

    describe('modifiers', () => {

        it('should apply a single modifier', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

            api.modifierRegistry.register({
                id: 'buff1',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value + 1
            })

            api.invalidateCache()
            expect(api.query('c1', 'power')).toBe(3) // 2 + 1
        })

        it('should stack multiple modifiers on same attribute', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

            api.modifierRegistry.register({
                id: 'buff1',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value + 1
            })

            api.modifierRegistry.register({
                id: 'buff2',
                attribute: 'power',
                layer: 1,
                timestamp: 1,
                condition: () => true,
                apply: (value) => value + 2
            })

            api.invalidateCache()
            expect(api.query('c1', 'power')).toBe(5) // 2 + 1 + 2
        })

        it('should apply modifiers in layer order', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

            // Layer 2 : double
            api.modifierRegistry.register({
                id: 'double',
                attribute: 'power',
                layer: 2,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value * 2
            })

            // Layer 1 : +3 (appliqué avant le double)
            api.modifierRegistry.register({
                id: 'flat',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value + 3
            })

            api.invalidateCache()
            // (2 + 3) * 2 = 10
            expect(api.query('c1', 'power')).toBe(10)
        })

        it('should use timestamp as tiebreaker within same layer', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

            // timestamp 1 : set to 10
            api.modifierRegistry.register({
                id: 'set10',
                attribute: 'power',
                layer: 1,
                timestamp: 1,
                condition: () => true,
                apply: () => 10
            })

            // timestamp 0 : +5 (appliqué avant set10)
            api.modifierRegistry.register({
                id: 'add5',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value + 5
            })

            api.invalidateCache()
            // base=2, +5=7, set10=10
            expect(api.query('c1', 'power')).toBe(10)
        })

        it('should respect condition filter', () => {
            const state = makeState()
            const api = new QueryAPI(state, makeZoneTypeRegistry())

            // Buff uniquement pour les cartes sur le board
            api.modifierRegistry.register({
                id: 'board_buff',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: (entityId, s) => {
                    const card = s.cards[entityId]
                    return card && card.zoneId.startsWith('board')
                },
                apply: (value) => value + 5
            })

            api.invalidateCache()
            expect(api.query('c1', 'power')).toBe(7) // c1 sur board : 2 + 5
            expect(api.query('c2', 'power')).toBe(3) // c2 sur hand : pas affecté
        })

        it('should update after modifier removal', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

            api.modifierRegistry.register({
                id: 'buff',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => value + 10
            })

            api.invalidateCache()
            expect(api.query('c1', 'power')).toBe(12)

            api.modifierRegistry.remove('buff')
            api.invalidateCache()
            expect(api.query('c1', 'power')).toBe(2)
        })
    })

    describe('cache', () => {

        it('should cache results within same state version', () => {
            const state = makeState(5)
            const api = new QueryAPI(state, makeZoneTypeRegistry())

            let callCount = 0
            api.modifierRegistry.register({
                id: 'counting',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => { callCount++; return value }
            })

            api.query('c1', 'power')
            api.query('c1', 'power')
            api.query('c1', 'power')

            // Le modifier n'est appelé qu'une fois (cache)
            expect(callCount).toBe(1)
        })

        it('should invalidate cache when state version changes', () => {
            const state = makeState(1)
            const api = new QueryAPI(state, makeZoneTypeRegistry())

            let callCount = 0
            api.modifierRegistry.register({
                id: 'counting',
                attribute: 'power',
                layer: 1,
                timestamp: 0,
                condition: () => true,
                apply: (value) => { callCount++; return value }
            })

            api.query('c1', 'power')
            expect(callCount).toBe(1)

            // Simuler un changement de state
            const newState = { ...state, version: 2 }
            api.updateState(newState)

            api.query('c1', 'power')
            expect(callCount).toBe(2)
        })
    })

    describe('replay stability', () => {

        it('should produce identical results with same modifiers and state', () => {
            const run = () => {
                const api = new QueryAPI(makeState(), makeZoneTypeRegistry())

                api.modifierRegistry.register({
                    id: 'buff',
                    attribute: 'power',
                    layer: 1,
                    timestamp: 0,
                    condition: () => true,
                    apply: (value) => value + 3
                })

                api.modifierRegistry.register({
                    id: 'debuff',
                    attribute: 'power',
                    layer: 2,
                    timestamp: 0,
                    condition: () => true,
                    apply: (value) => Math.max(0, value - 1)
                })

                api.invalidateCache()
                return {
                    c1: api.query('c1', 'power'),
                    c2: api.query('c2', 'power'),
                    c3: api.query('c3', 'power')
                }
            }

            expect(run()).toEqual(run())
        })
    })

    describe('visibility', () => {

        it('should respect zone visibility (public)', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            // c1 is on board (public)
            expect(api.isVisibleTo('c1', 'p1')).toBe(true)
            expect(api.isVisibleTo('c1', 'p2')).toBe(true)
        })

        it('should respect zone visibility (owner)', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            // c2 is in hand (owner only)
            expect(api.isVisibleTo('c2', 'p1')).toBe(true)
            expect(api.isVisibleTo('c2', 'p2')).toBe(false)
        })

        it('should respect zone visibility (hidden)', () => {
            const api = new QueryAPI(makeState(), makeZoneTypeRegistry())
            // c3 is in deck (hidden)
            expect(api.isVisibleTo('c3', 'p1')).toBe(false)
            expect(api.isVisibleTo('c3', 'p2')).toBe(false)
        })

        it('should respect visibilityOverride', () => {
            const state = makeState()
            state.cards.c3.visibilityOverride = 'public'
            const api = new QueryAPI(state, makeZoneTypeRegistry())

            // c3 en deck mais override public
            expect(api.isVisibleTo('c3', 'p1')).toBe(true)
            expect(api.isVisibleTo('c3', 'p2')).toBe(true)
        })
    })
})
