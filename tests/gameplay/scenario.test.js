/**
 * Tests scenario — partie TCG heroes-as-creatures.
 */

import { describe, it, expect } from 'vitest'
import { createGame, startGame } from '../../src/gameplay/setup.js'
import PlaySpellCommand from '../../src/gameplay/commands/PlaySpellCommand.js'
import AttackCommand from '../../src/gameplay/commands/AttackCommand.js'
import EndTurnCommand from '../../src/gameplay/commands/EndTurnCommand.js'

// Helper : retourne les cartes dans une zone donnee
function cardsInZone(state, zoneId) {
    return Object.values(state.cards).filter(c => c.zoneId === zoneId)
}

function heroesForPlayer(state, playerId) {
    return Object.values(state.heroes).filter(h => h.playerId === playerId)
}

describe('Game Setup', () => {

    it('should create a valid initial state with StartGameCommand', () => {
        const engine = startGame({ seed: 100 })
        const state = engine.state

        // Joueur 1 a 3 mana, joueur 2 a 0
        expect(state.players.player1.attributes.mana).toBe(3)
        expect(state.players.player1.attributes.maxMana).toBe(3)

        // 4 zone types x 2 joueurs = 8 zones
        expect(Object.keys(state.zones)).toHaveLength(8)

        // 2 heroes par joueur
        expect(heroesForPlayer(state, 'player1')).toHaveLength(2)
        expect(heroesForPlayer(state, 'player2')).toHaveLength(2)

        // Chaque hero a power et maxHp
        for (const hero of Object.values(state.heroes)) {
            expect(hero.attributes.power).toBeGreaterThan(0)
            expect(hero.attributes.maxHp).toBe(hero.attributes.hp)
            expect(hero.attributes.hasAttacked).toBe(false)
        }

        // Joueur 1 pioche 3, joueur 2 pioche 4
        const hand1 = cardsInZone(state, 'hand_player1')
        const hand2 = cardsInZone(state, 'hand_player2')
        expect(hand1).toHaveLength(3)
        expect(hand2).toHaveLength(4)

        // Decks : 15 - piochees
        const deck1 = cardsInZone(state, 'deck_player1')
        const deck2 = cardsInZone(state, 'deck_player2')
        expect(deck1).toHaveLength(12)
        expect(deck2).toHaveLength(11)

        // Tour 1, joueur 1 actif
        expect(state.turnState.activePlayerId).toBe('player1')
        expect(state.turnState.turnNumber).toBe(1)
    })

    it('should be deterministic (same seed = same state)', () => {
        const hash1 = startGame({ seed: 42 }).getViewHash()
        const hash2 = startGame({ seed: 42 }).getViewHash()
        expect(hash1).toBe(hash2)
    })

    it('should produce different states with different seeds', () => {
        const hash1 = startGame({ seed: 1 }).getViewHash()
        const hash2 = startGame({ seed: 2 }).getViewHash()
        expect(hash1).not.toBe(hash2)
    })
})

describe('Turn Flow', () => {

    it('should end turn and start opponent turn', () => {
        const engine = startGame({ seed: 100 })

        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()

        expect(engine.state.turnState.activePlayerId).toBe('player2')
        // Joueur 2 pioche 1 carte et a 1 mana
        const hand2 = cardsInZone(engine.state, 'hand_player2')
        expect(hand2).toHaveLength(5) // 4 initiales + 1 piochee
        expect(engine.state.players.player2.attributes.mana).toBe(1)
    })

    it('should increment mana each turn', () => {
        const engine = startGame({ seed: 100 })

        // Tour 1->2
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()
        expect(engine.state.players.player2.attributes.maxMana).toBe(1)

        // Tour 2->3 : player1 avait maxMana=3, apres StartTurn -> maxMana=4
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine.runUntilIdle()
        expect(engine.state.players.player1.attributes.maxMana).toBe(4)
        expect(engine.state.players.player1.attributes.mana).toBe(4)
    })
})

describe('Combat', () => {

    it('should handle hero-vs-hero attack with mutual damage', () => {
        const engine = createGame({ seed: 42 })
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
            },
            cards: {},
            heroes: {
                h1: {
                    id: 'h1', heroDefId: 'WARRIOR', playerId: 'player1',
                    attributes: { hp: 30, maxHp: 30, power: 4, ap: 5, maxAp: 5, mana: 0, maxMana: 0, speed: 3, hasAttacked: false }
                },
                h2: {
                    id: 'h2', heroDefId: 'MAGE', playerId: 'player2',
                    attributes: { hp: 15, maxHp: 15, power: 2, ap: 0, maxAp: 8, mana: 0, maxMana: 0, speed: 2, hasAttacked: false }
                }
            },
            zones: {
                board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
                board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
                hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
                hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
                deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
                deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
                graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
                graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
            },
            turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main' }
        })

        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1',
            attackerId: 'h1',
            targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Degats mutuels : h2 perd 4 HP (power de h1), h1 perd 2 HP (power de h2)
        expect(engine.state.heroes.h2.attributes.hp).toBe(11)
        expect(engine.state.heroes.h1.attributes.hp).toBe(28)
        expect(engine.state.heroes.h1.attributes.hasAttacked).toBe(true)

        // COMBAT_RESOLVED emis
        expect(events.some(e => e.type === 'COMBAT_RESOLVED')).toBe(true)
    })

    it('should reject attack if hero already attacked', () => {
        const engine = createGame({ seed: 42 })
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
            },
            cards: {},
            heroes: {
                h1: {
                    id: 'h1', heroDefId: 'WARRIOR', playerId: 'player1',
                    attributes: { hp: 30, maxHp: 30, power: 4, ap: 5, maxAp: 5, mana: 0, maxMana: 0, speed: 3, hasAttacked: true }
                },
                h2: {
                    id: 'h2', heroDefId: 'MAGE', playerId: 'player2',
                    attributes: { hp: 15, maxHp: 15, power: 2, ap: 0, maxAp: 8, mana: 0, maxMana: 0, speed: 2, hasAttacked: false }
                }
            },
            zones: {
                board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
                board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
                hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
                hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
                deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
                deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
                graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
                graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
            },
            turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main' }
        })

        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1',
            attackerId: 'h1',
            targetId: 'h2'
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
        // HP unchanged
        expect(engine.state.heroes.h2.attributes.hp).toBe(15)
    })
})

describe('Spells', () => {

    it('should cast Fireball dealing damage to a hero', () => {
        const engine = createGame({ seed: 42 })

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
            },
            cards: {
                fb1: {
                    id: 'fb1', definitionId: 'FIREBALL', ownerId: 'player1',
                    zoneId: 'hand_player1',
                    attributes: { type: 'spell', cost: 3, effect: 'DEAL_DAMAGE', effectPayload: JSON.stringify({ amount: 3 }) },
                    visibilityOverride: null
                }
            },
            heroes: {
                h1: {
                    id: 'h1', heroDefId: 'WARRIOR', playerId: 'player1',
                    attributes: { hp: 30, maxHp: 30, power: 4, ap: 5, maxAp: 5, mana: 0, maxMana: 0, speed: 3, hasAttacked: false }
                },
                h2: {
                    id: 'h2', heroDefId: 'MAGE', playerId: 'player2',
                    attributes: { hp: 15, maxHp: 15, power: 2, ap: 0, maxAp: 8, mana: 0, maxMana: 0, speed: 2, hasAttacked: false }
                }
            },
            zones: {
                board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
                board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
                hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
                hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
                deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
                deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
                graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
                graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
            },
            turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main' }
        })

        engine.enqueueCommand(new PlaySpellCommand({
            playerId: 'player1',
            cardId: 'fb1',
            targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Fireball au graveyard
        expect(engine.state.cards.fb1.zoneId).toBe('graveyard_player1')
        // 3 degats sur le hero ennemi
        expect(engine.state.heroes.h2.attributes.hp).toBe(12)
    })

    it('should cast Heal restoring HP to an ally hero', () => {
        const engine = createGame({ seed: 42 })

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
            },
            cards: {
                heal1: {
                    id: 'heal1', definitionId: 'HEAL', ownerId: 'player1',
                    zoneId: 'hand_player1',
                    attributes: { type: 'spell', cost: 2, effect: 'RESTORE_HP', effectPayload: JSON.stringify({ amount: 4 }) },
                    visibilityOverride: null
                }
            },
            heroes: {
                h1: {
                    id: 'h1', heroDefId: 'WARRIOR', playerId: 'player1',
                    attributes: { hp: 10, maxHp: 30, power: 4, ap: 5, maxAp: 5, mana: 0, maxMana: 0, speed: 3, hasAttacked: false }
                }
            },
            zones: {
                board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
                board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
                hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
                hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
                deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
                deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
                graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
                graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
            },
            turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main' }
        })

        engine.enqueueCommand(new PlaySpellCommand({
            playerId: 'player1',
            cardId: 'heal1',
            targetId: 'h1'
        }))
        engine.runUntilIdle()

        // Heal au graveyard
        expect(engine.state.cards.heal1.zoneId).toBe('graveyard_player1')
        // 4 HP restaures (10 + 4 = 14, cap a 30)
        expect(engine.state.heroes.h1.attributes.hp).toBe(14)
    })
})

describe('Win Condition', () => {

    it('should end game when all heroes of a player are destroyed', () => {
        const engine = createGame({ seed: 42 })
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { mana: 0, maxMana: 0 } }
            },
            cards: {},
            heroes: {
                h1: {
                    id: 'h1', heroDefId: 'WARRIOR', playerId: 'player1',
                    attributes: { hp: 30, maxHp: 30, power: 10, ap: 5, maxAp: 5, mana: 0, maxMana: 0, speed: 3, hasAttacked: false }
                },
                h2: {
                    id: 'h2', heroDefId: 'MAGE', playerId: 'player2',
                    attributes: { hp: 2, maxHp: 15, power: 1, ap: 0, maxAp: 8, mana: 0, maxMana: 0, speed: 2, hasAttacked: false }
                }
            },
            zones: {
                board_player1: { id: 'board_player1', zoneTypeId: 'board', ownerId: 'player1' },
                board_player2: { id: 'board_player2', zoneTypeId: 'board', ownerId: 'player2' },
                hand_player1: { id: 'hand_player1', zoneTypeId: 'hand', ownerId: 'player1' },
                hand_player2: { id: 'hand_player2', zoneTypeId: 'hand', ownerId: 'player2' },
                deck_player1: { id: 'deck_player1', zoneTypeId: 'deck', ownerId: 'player1' },
                deck_player2: { id: 'deck_player2', zoneTypeId: 'deck', ownerId: 'player2' },
                graveyard_player1: { id: 'graveyard_player1', zoneTypeId: 'graveyard', ownerId: 'player1' },
                graveyard_player2: { id: 'graveyard_player2', zoneTypeId: 'graveyard', ownerId: 'player2' }
            },
            turnState: { activePlayerId: 'player1', turnNumber: 5, phase: 'main' }
        })

        // Hero h1 (power 10) attaque hero h2 (hp 2) — h2 meurt
        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1',
            attackerId: 'h1',
            targetId: 'h2'
        }))
        engine.runUntilIdle()

        // Hero h2 detruit
        expect(engine.state.heroes.h2).toBeUndefined()

        // GAME_OVER car player2 n'a plus de heroes
        expect(engine.state.turnState.phase).toBe('game_over')
        expect(events.some(e => e.type === 'GAME_OVER')).toBe(true)

        const gameOver = events.find(e => e.type === 'GAME_OVER')
        expect(gameOver.payload.winnerId).toBe('player1')
        expect(gameOver.payload.loserId).toBe('player2')
    })
})

describe('Replay', () => {

    it('should replay a full game to identical state', () => {
        const engine1 = startGame({ seed: 77 })

        // Jouer quelques tours
        engine1.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine1.runUntilIdle()

        engine1.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine1.runUntilIdle()

        const hash1 = engine1.getViewHash()
        const replay = engine1.exportReplay()

        // Replay
        const engine2 = createGame({ seed: 0 })
        engine2.importReplay(replay)
        engine2.runUntilIdle()

        expect(engine2.getViewHash()).toBe(hash1)
    })
})
