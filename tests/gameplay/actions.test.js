/**
 * Tests actions hero — Defend, UsePower, ApplyBuff, armor mechanics.
 */

import { describe, it, expect } from 'vitest'
import { createGame } from '../../src/gameplay/setup.js'
import AttackCommand from '../../src/gameplay/commands/AttackCommand.js'
import DefendCommand from '../../src/gameplay/commands/DefendCommand.js'
import UsePowerCommand from '../../src/gameplay/commands/UsePowerCommand.js'
import EndTurnCommand from '../../src/gameplay/commands/EndTurnCommand.js'

const ZONES = {
    board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
    board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
    hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
    hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
    deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
    deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
    graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
    graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
}

function makeHero(id, heroDefId, playerId, overrides = {}) {
    return {
        id, heroDefId, playerId,
        attributes: {
            hp: 30, maxHp: 30, power: 4, ap: 5, maxAp: 5,
            mana: 0, maxMana: 0, speed: 3,
            hasActed: false, armor: 0, isDefending: false, activeBuffs: '[]',
            ...overrides
        }
    }
}

function setupEngine(heroes, turnState = {}) {
    const engine = createGame({ seed: 42 })
    engine.initialize({
        players: {
            player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
            player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
        },
        cards: {},
        heroes,
        zones: ZONES,
        turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main', ...turnState }
    })
    return engine
}

describe('DefendCommand', () => {

    it('should set armor and hasActed when defending', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1')
        })

        engine.enqueueCommand(new DefendCommand({ playerId: 'player1', heroId: 'h1' }))
        engine.runUntilIdle()

        const hero = engine.state.heroes.h1
        expect(hero.attributes.hasActed).toBe(true)
        expect(hero.attributes.isDefending).toBe(true)
        expect(hero.attributes.armor).toBe(4) // WARRIOR power = 4
    })

    it('should reject defend if hero already acted', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { hasActed: true })
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new DefendCommand({ playerId: 'player1', heroId: 'h1' }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
    })

    it('should reject defend if not your turn', () => {
        const events = []
        const engine = setupEngine({
            h2: makeHero('h2', 'MAGE', 'player2')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new DefendCommand({ playerId: 'player2', heroId: 'h2' }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
    })

    it('should emit HERO_DEFENDED event', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new DefendCommand({ playerId: 'player1', heroId: 'h1' }))
        engine.runUntilIdle()

        const defended = events.find(e => e.type === 'HERO_DEFENDED')
        expect(defended).toBeDefined()
        expect(defended.payload.armorGained).toBe(4)
    })
})

describe('Armor in combat', () => {

    it('should reduce damage by armor amount', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { power: 4 }),
            h2: makeHero('h2', 'MAGE', 'player2', { hp: 15, maxHp: 15, power: 2, armor: 3 })
        })

        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1', attackerId: 'h1', targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Target has 3 armor, attacker power 4 → damage = max(0, 4-3) = 1
        expect(engine.state.heroes.h2.attributes.hp).toBe(14)
        // Attacker takes full damage from target (power 2, no armor)
        expect(engine.state.heroes.h1.attributes.hp).toBe(28)
    })

    it('should not deal negative damage with high armor', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { power: 2 }),
            h2: makeHero('h2', 'MAGE', 'player2', { hp: 15, maxHp: 15, power: 2, armor: 10 })
        })

        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1', attackerId: 'h1', targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Armor > power → 0 damage
        expect(engine.state.heroes.h2.attributes.hp).toBe(15)
    })
})

describe('UsePowerCommand', () => {

    it('should deduct AP and deal damage with ARCANE_BOLT', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'MAGE', 'player1', { power: 2, ap: 5, maxAp: 8, hp: 15, maxHp: 15 }),
            h2: makeHero('h2', 'WARRIOR', 'player2')
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'ARCANE_BOLT', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h1.attributes.ap).toBe(3) // 5 - 2
        expect(engine.state.heroes.h1.attributes.hasActed).toBe(true)
        expect(engine.state.heroes.h2.attributes.hp).toBe(27) // 30 - 3
    })

    it('should reject if not enough AP', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'MAGE', 'player1', { power: 2, ap: 1, maxAp: 8, hp: 15, maxHp: 15 }),
            h2: makeHero('h2', 'WARRIOR', 'player2')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'ARCANE_BOLT', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
        expect(engine.state.heroes.h2.attributes.hp).toBe(30)
    })

    it('should reject if power does not match hero class', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { ap: 5 }),
            h2: makeHero('h2', 'MAGE', 'player2')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'ARCANE_BOLT', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
    })

    it('should not set hasActed for freeAction (QUICK_SHOT)', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'RANGER', 'player1', { power: 3, ap: 5, maxAp: 4, hp: 20, maxHp: 20, speed: 4 }),
            h2: makeHero('h2', 'WARRIOR', 'player2')
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'QUICK_SHOT', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h1.attributes.hasActed).toBe(false) // freeAction!
        expect(engine.state.heroes.h1.attributes.ap).toBe(3) // 5 - 2
        expect(engine.state.heroes.h2.attributes.hp).toBe(28) // 30 - 2
    })

    it('should apply self buff with WAR_CRY', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { ap: 5 })
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'WAR_CRY'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h1.attributes.power).toBe(6) // 4 + 2
        expect(engine.state.heroes.h1.attributes.ap).toBe(2) // 5 - 3
        expect(engine.state.heroes.h1.attributes.hasActed).toBe(true)

        const buffs = JSON.parse(engine.state.heroes.h1.attributes.activeBuffs)
        expect(buffs).toHaveLength(1)
        expect(buffs[0].attribute).toBe('power')
        expect(buffs[0].delta).toBe(2)
    })

    it('should heal ally with HOLY_HEAL', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'PRIEST', 'player1', { power: 1, ap: 6, maxAp: 6, hp: 18, maxHp: 18, speed: 3 }),
            h2: makeHero('h2', 'WARRIOR', 'player1', { hp: 10, maxHp: 30 })
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'HOLY_HEAL', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h2.attributes.hp).toBe(15) // 10 + 5
    })

    it('should reject enemy target for ally power', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'PRIEST', 'player1', { power: 1, ap: 6, maxAp: 6, hp: 18, maxHp: 18, speed: 3 }),
            h2: makeHero('h2', 'WARRIOR', 'player2')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'HOLY_HEAL', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
    })

    it('should deal damage to all enemies with METEOR', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'MAGE', 'player1', { power: 2, ap: 8, maxAp: 8, hp: 15, maxHp: 15 }),
            h2: makeHero('h2', 'WARRIOR', 'player2', { hp: 30 }),
            h3: makeHero('h3', 'RANGER', 'player2', { hp: 20, maxHp: 20, power: 3 })
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'METEOR'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h1.attributes.ap).toBe(2) // 8 - 6
        expect(engine.state.heroes.h2.attributes.hp).toBe(26) // 30 - 4
        expect(engine.state.heroes.h3.attributes.hp).toBe(16) // 20 - 4
    })

    it('should deal double power with CHARGE', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { ap: 5 }),
            h2: makeHero('h2', 'MAGE', 'player2', { hp: 15, maxHp: 15, power: 2 })
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'CHARGE', targetId: 'h2'
        }))
        engine.runUntilIdle()

        // WARRIOR power 4, double = 8
        expect(engine.state.heroes.h2.attributes.hp).toBe(7) // 15 - 8
    })

    it('should apply debuff with SHIELD_BASH', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { ap: 5 }),
            h2: makeHero('h2', 'MAGE', 'player2', { hp: 15, maxHp: 15, power: 2 })
        })

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'SHIELD_BASH', targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Deal power dmg (4) + reduce power by 1
        expect(engine.state.heroes.h2.attributes.hp).toBe(11) // 15 - 4
        expect(engine.state.heroes.h2.attributes.power).toBe(1) // 2 - 1
    })

    it('should emit POWER_USED event', () => {
        const events = []
        const engine = setupEngine({
            h1: makeHero('h1', 'MAGE', 'player1', { power: 2, ap: 5, maxAp: 8, hp: 15, maxHp: 15 }),
            h2: makeHero('h2', 'WARRIOR', 'player2')
        })
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'ARCANE_BOLT', targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'POWER_USED')).toBe(true)
    })
})

describe('Buff expiry', () => {

    it('should expire buffs at start of turn and reverse delta', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { ap: 5 }),
            h2: makeHero('h2', 'MAGE', 'player2', { power: 2, ap: 2, maxAp: 8, hp: 15, maxHp: 15, speed: 2 })
        })

        // Apply WAR_CRY buff (+2 power, duration 1 → expires turn 6)
        engine.enqueueCommand(new UsePowerCommand({
            playerId: 'player1', heroId: 'h1', powerId: 'WAR_CRY'
        }))
        engine.runUntilIdle()

        expect(engine.state.heroes.h1.attributes.power).toBe(6) // 4 + 2

        // End turn → player2 → end turn → player1 turn starts (turn 6)
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine.runUntilIdle()

        // Buff expired at turn 6 start → power back to 4
        expect(engine.state.heroes.h1.attributes.power).toBe(4)
        expect(engine.state.heroes.h1.attributes.hasActed).toBe(false)
        expect(engine.state.heroes.h1.attributes.armor).toBe(0)
        expect(engine.state.heroes.h1.attributes.isDefending).toBe(false)
    })
})

describe('Turn reset', () => {

    it('should reset hasActed, armor and isDefending on turn start', () => {
        const engine = setupEngine({
            h1: makeHero('h1', 'WARRIOR', 'player1', { hasActed: true, armor: 4, isDefending: true }),
            h2: makeHero('h2', 'MAGE', 'player2', { power: 2, ap: 2, maxAp: 8, hp: 15, maxHp: 15, speed: 2 })
        })

        // End turn p1 → p2 → end turn p2 → p1 start turn
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine.runUntilIdle()

        const hero = engine.state.heroes.h1
        expect(hero.attributes.hasActed).toBe(false)
        expect(hero.attributes.armor).toBe(0)
        expect(hero.attributes.isDefending).toBe(false)
    })
})
