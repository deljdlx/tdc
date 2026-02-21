/**
 * Tests heros — creation, compteurs AP et mana, combat attributes.
 */

import { describe, it, expect } from 'vitest'
import { startGame } from '../../src/gameplay/setup.js'
import EndTurnCommand from '../../src/gameplay/commands/EndTurnCommand.js'
import { HERO_DEFINITIONS } from '../../src/gameplay/definitions/heroes.js'

function heroesForPlayer(state, playerId) {
    return Object.values(state.heroes).filter(h => h.playerId === playerId)
}

describe('Hero System', () => {

    it('should create 2 heroes per player at game start', () => {
        const engine = startGame({ seed: 100 })
        const state = engine.state

        const heroes1 = heroesForPlayer(state, 'player1')
        const heroes2 = heroesForPlayer(state, 'player2')
        expect(heroes1).toHaveLength(2)
        expect(heroes2).toHaveLength(2)
    })

    it('should assign valid hero definitions', () => {
        const engine = startGame({ seed: 100 })
        const state = engine.state

        const allHeroes = Object.values(state.heroes)
        const validIds = HERO_DEFINITIONS.map(d => d.id)

        for (const hero of allHeroes) {
            expect(validIds).toContain(hero.heroDefId)
        }
    })

    it('should initialize hero attributes from definition', () => {
        const engine = startGame({ seed: 100 })
        const state = engine.state

        for (const hero of Object.values(state.heroes)) {
            const def = HERO_DEFINITIONS.find(d => d.id === hero.heroDefId)
            expect(hero.attributes.hp).toBe(def.hp)
            expect(hero.attributes.maxHp).toBe(def.hp)
            expect(hero.attributes.power).toBe(def.power)
            expect(hero.attributes.maxAp).toBe(def.maxAp)
            expect(hero.attributes.speed).toBe(def.speed)
            expect(hero.attributes.ap).toBe(0)
            expect(hero.attributes.mana).toBe(0)
            expect(hero.attributes.maxMana).toBe(0)
            expect(hero.attributes.hasActed).toBe(false)
            expect(hero.attributes.armor).toBe(0)
            expect(hero.attributes.isDefending).toBe(false)
            expect(hero.attributes.activeBuffs).toBe('[]')
        }
    })

    it('should recharge hero AP on turn start based on speed', () => {
        const engine = startGame({ seed: 100 })

        // End turn to trigger opponent's StartTurn
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()

        const state = engine.state
        const heroes2 = heroesForPlayer(state, 'player2')

        for (const hero of heroes2) {
            const def = HERO_DEFINITIONS.find(d => d.id === hero.heroDefId)
            // After 1 turn start: ap = min(0 + speed, maxAp)
            expect(hero.attributes.ap).toBe(Math.min(def.speed, def.maxAp))
        }
    })

    it('should recharge hero mana on turn start', () => {
        const engine = startGame({ seed: 100 })

        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()

        const state = engine.state
        const heroes2 = heroesForPlayer(state, 'player2')

        for (const hero of heroes2) {
            // After 1 turn start: maxMana = 1, mana = 1
            expect(hero.attributes.maxMana).toBe(1)
            expect(hero.attributes.mana).toBe(1)
        }
    })

    it('should reset hasActed on turn start', () => {
        const engine = startGame({ seed: 100 })

        // All heroes start with hasActed: false
        for (const hero of Object.values(engine.state.heroes)) {
            expect(hero.attributes.hasActed).toBe(false)
        }

        // End two turns to come back to player1
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine.runUntilIdle()

        // Player1 heroes should have hasActed reset
        const heroes1 = heroesForPlayer(engine.state, 'player1')
        for (const hero of heroes1) {
            expect(hero.attributes.hasActed).toBe(false)
        }
    })

    it('should cap hero AP at maxAp after multiple turns', () => {
        const engine = startGame({ seed: 100 })

        // Play several turns to accumulate AP
        for (let i = 0; i < 10; i++) {
            const activeId = engine.state.turnState.activePlayerId
            engine.enqueueCommand(new EndTurnCommand({ playerId: activeId }))
            engine.runUntilIdle()
        }

        const state = engine.state
        for (const hero of Object.values(state.heroes)) {
            expect(hero.attributes.ap).toBeLessThanOrEqual(hero.attributes.maxAp)
        }
    })

    it('should cap hero mana at 10', () => {
        const engine = startGame({ seed: 100 })

        for (let i = 0; i < 20; i++) {
            const activeId = engine.state.turnState.activePlayerId
            engine.enqueueCommand(new EndTurnCommand({ playerId: activeId }))
            engine.runUntilIdle()
        }

        const state = engine.state
        for (const hero of Object.values(state.heroes)) {
            expect(hero.attributes.maxMana).toBeLessThanOrEqual(10)
            expect(hero.attributes.mana).toBeLessThanOrEqual(10)
        }
    })
})
