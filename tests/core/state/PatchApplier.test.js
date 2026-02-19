/**
 * Tests PatchApplier — vérifie l'application des patches typés.
 */

import { describe, it, expect } from 'vitest'
import PatchApplier from '../../../src/core/state/PatchApplier.js'

function makeState() {
    return {
        players: {
            p1: { id: 'p1', name: 'Alice', attributes: { hp: 20, mana: 3 } }
        },
        cards: {
            c1: { id: 'c1', definitionId: 'FIGHTER', ownerId: 'p1', zoneId: 'hand_p1', attributes: { power: 2 }, visibilityOverride: null }
        },
        zones: {
            hand_p1: { id: 'hand_p1', zoneTypeId: 'hand', ownerId: 'p1' },
            board_p1: { id: 'board_p1', zoneTypeId: 'board', ownerId: 'p1' }
        },
        turnState: { activePlayerId: 'p1', turnNumber: 1, phase: 'main' },
        version: 0
    }
}

describe('PatchApplier', () => {
    const applier = new PatchApplier()

    it('should SET_ATTRIBUTE on a player', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'SET_ATTRIBUTE',
            target: 'p1',
            payload: { key: 'hp', value: 15 }
        })

        expect(next.players.p1.attributes.hp).toBe(15)
        // Original non muté
        expect(state.players.p1.attributes.hp).toBe(20)
    })

    it('should SET_ATTRIBUTE on a card', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'SET_ATTRIBUTE',
            target: 'c1',
            payload: { key: 'power', value: 5 }
        })

        expect(next.cards.c1.attributes.power).toBe(5)
        expect(state.cards.c1.attributes.power).toBe(2)
    })

    it('should MOVE_CARD', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'MOVE_CARD',
            target: 'c1',
            payload: { fromZoneId: 'hand_p1', toZoneId: 'board_p1' }
        })

        expect(next.cards.c1.zoneId).toBe('board_p1')
        expect(state.cards.c1.zoneId).toBe('hand_p1')
    })

    it('should MOVE_CARD throw if wrong source zone', () => {
        const state = makeState()
        expect(() => applier.apply(state, {
            type: 'MOVE_CARD',
            target: 'c1',
            payload: { fromZoneId: 'board_p1', toZoneId: 'hand_p1' }
        })).toThrow('not "board_p1"')
    })

    it('should CREATE_ENTITY', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'CREATE_ENTITY',
            target: 'c2',
            payload: { entityType: 'card', data: { definitionId: 'ARCHER', ownerId: 'p1', zoneId: 'hand_p1', attributes: {} } }
        })

        expect(next.cards.c2).toBeDefined()
        expect(next.cards.c2.definitionId).toBe('ARCHER')
        expect(state.cards.c2).toBeUndefined()
    })

    it('should REMOVE_ENTITY', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'REMOVE_ENTITY',
            target: 'c1',
            payload: {}
        })

        expect(next.cards.c1).toBeUndefined()
        expect(state.cards.c1).toBeDefined()
    })

    it('should SET_TURN_STATE', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'SET_TURN_STATE',
            target: 'turnState',
            payload: { field: 'phase', value: 'combat' }
        })

        expect(next.turnState.phase).toBe('combat')
        expect(state.turnState.phase).toBe('main')
    })

    it('should SET_VISIBILITY_OVERRIDE', () => {
        const state = makeState()
        const next = applier.apply(state, {
            type: 'SET_VISIBILITY_OVERRIDE',
            target: 'c1',
            payload: { visibility: 'public' }
        })

        expect(next.cards.c1.visibilityOverride).toBe('public')
        expect(state.cards.c1.visibilityOverride).toBeNull()
    })

    it('should throw on unknown patch type', () => {
        const state = makeState()
        expect(() => applier.apply(state, {
            type: 'UNKNOWN_PATCH',
            target: 'x',
            payload: {}
        })).toThrow('unknown patch type "UNKNOWN_PATCH"')
    })

    it('should applyAll sequentially', () => {
        const state = makeState()
        const next = applier.applyAll(state, [
            { type: 'SET_ATTRIBUTE', target: 'p1', payload: { key: 'hp', value: 10 } },
            { type: 'MOVE_CARD', target: 'c1', payload: { fromZoneId: 'hand_p1', toZoneId: 'board_p1' } }
        ])

        expect(next.players.p1.attributes.hp).toBe(10)
        expect(next.cards.c1.zoneId).toBe('board_p1')
    })

    it('should not mutate original state (immutability)', () => {
        const state = makeState()
        const frozen = JSON.stringify(state)

        applier.apply(state, {
            type: 'SET_ATTRIBUTE',
            target: 'p1',
            payload: { key: 'hp', value: 0 }
        })

        expect(JSON.stringify(state)).toBe(frozen)
    })
})
