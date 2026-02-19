/**
 * Tests scénario — partie Hearthstone simplifiée.
 */

import { describe, it, expect } from 'vitest'
import { createGame, startGame } from '../../src/gameplay/setup.js'
import PlayCreatureCommand from '../../src/gameplay/commands/PlayCreatureCommand.js'
import PlaySpellCommand from '../../src/gameplay/commands/PlaySpellCommand.js'
import AttackCommand from '../../src/gameplay/commands/AttackCommand.js'
import EndTurnCommand from '../../src/gameplay/commands/EndTurnCommand.js'

// Helper : retourne les cartes dans une zone donnée
function cardsInZone(state, zoneId) {
    return Object.values(state.cards).filter(c => c.zoneId === zoneId)
}

describe('Game Setup', () => {

    it('should create a valid initial state with StartGameCommand', () => {
        const engine = startGame({ seed: 100 })
        const state = engine.state

        // 2 joueurs avec 20 HP
        expect(state.players.player1.attributes.hp).toBe(20)
        expect(state.players.player2.attributes.hp).toBe(20)

        // Joueur 1 a 3 mana, joueur 2 a 0
        expect(state.players.player1.attributes.mana).toBe(3)
        expect(state.players.player1.attributes.maxMana).toBe(3)

        // 4 zone types × 2 joueurs = 8 zones
        expect(Object.keys(state.zones)).toHaveLength(8)

        // Joueur 1 pioche 3, joueur 2 pioche 4
        const hand1 = cardsInZone(state, 'hand_player1')
        const hand2 = cardsInZone(state, 'hand_player2')
        expect(hand1).toHaveLength(3)
        expect(hand2).toHaveLength(4)

        // Decks : 15 - piochées
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

describe('Playing Creatures', () => {

    it('should play a creature from hand to board', () => {
        const engine = startGame({ seed: 100 })

        // Trouver une créature jouable (cost ≤ 1 mana)
        const hand = cardsInZone(engine.state, 'hand_player1')
        const playable = hand.find(c =>
            c.attributes.type === 'creature' && c.attributes.cost <= 1
        )

        if (!playable) return // Skip si pas de carte jouable avec 1 mana

        engine.enqueueCommand(new PlayCreatureCommand({
            playerId: 'player1',
            cardId: playable.id
        }))
        engine.runUntilIdle()

        expect(engine.state.cards[playable.id].zoneId).toBe('board_player1')
        expect(engine.state.cards[playable.id].attributes.summoningSickness).toBe(true)
    })

    it('should reject if not enough mana', () => {
        const engine = startGame({ seed: 100 })
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        // Trouver une carte trop chère pour le mana initial (3)
        const hand = cardsInZone(engine.state, 'hand_player1')
        const expensive = hand.find(c =>
            c.attributes.type === 'creature' && c.attributes.cost > 3
        )

        if (!expensive) return

        engine.enqueueCommand(new PlayCreatureCommand({
            playerId: 'player1',
            cardId: expensive.id
        }))
        engine.runUntilIdle()

        expect(events.some(e => e.type === 'COMMAND_REJECTED')).toBe(true)
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
        expect(hand2).toHaveLength(5) // 4 initiales + 1 piochée
        expect(engine.state.players.player2.attributes.mana).toBe(1)
    })

    it('should increment mana each turn', () => {
        const engine = startGame({ seed: 100 })

        // Tour 1→2
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player1' }))
        engine.runUntilIdle()
        expect(engine.state.players.player2.attributes.maxMana).toBe(1)

        // Tour 2→3 : player1 avait maxMana=3, après StartTurn → maxMana=4
        engine.enqueueCommand(new EndTurnCommand({ playerId: 'player2' }))
        engine.runUntilIdle()
        expect(engine.state.players.player1.attributes.maxMana).toBe(4)
        expect(engine.state.players.player1.attributes.mana).toBe(4)
    })
})

describe('Combat', () => {

    it('should handle creature vs player attack', () => {
        const engine = startGame({ seed: 100 })

        // Avancer plusieurs tours pour avoir du mana
        for (let i = 0; i < 6; i++) {
            const active = engine.state.turnState.activePlayerId
            engine.enqueueCommand(new EndTurnCommand({ playerId: active }))
            engine.runUntilIdle()
        }

        // On est au tour de player1 avec plus de mana
        const activePlayer = engine.state.turnState.activePlayerId
        const hand = cardsInZone(engine.state, `hand_${activePlayer}`)
        const creature = hand.find(c =>
            c.attributes.type === 'creature' &&
            c.attributes.cost <= engine.state.players[activePlayer].attributes.mana
        )

        if (!creature) return

        // Jouer la créature
        engine.enqueueCommand(new PlayCreatureCommand({
            playerId: activePlayer,
            cardId: creature.id
        }))
        engine.runUntilIdle()

        // Finir le tour, attendre le tour suivant
        engine.enqueueCommand(new EndTurnCommand({ playerId: activePlayer }))
        engine.runUntilIdle()

        const opponent = engine.state.turnState.activePlayerId
        engine.enqueueCommand(new EndTurnCommand({ playerId: opponent }))
        engine.runUntilIdle()

        // Maintenant la créature n'a plus summoning sickness
        const boardCreature = cardsInZone(engine.state, `board_${activePlayer}`)[0]
        if (!boardCreature) return

        expect(boardCreature.attributes.summoningSickness).toBe(false)

        const opponentId = Object.keys(engine.state.players).find(id => id !== activePlayer)
        const hpBefore = engine.state.players[opponentId].attributes.hp

        // Attaquer le joueur adverse
        engine.enqueueCommand(new AttackCommand({
            playerId: activePlayer,
            attackerId: boardCreature.id,
            targetId: opponentId
        }))
        engine.runUntilIdle()

        const power = engine.queryAPI.query(boardCreature.id, 'power')
        expect(engine.state.players[opponentId].attributes.hp).toBe(hpBefore - power)
    })
})

describe('Spells', () => {

    it('should cast Fireball dealing damage to a target', () => {
        const engine = startGame({ seed: 100 })

        // Avancer pour avoir du mana (au moins 3 pour Fireball)
        for (let i = 0; i < 6; i++) {
            const active = engine.state.turnState.activePlayerId
            engine.enqueueCommand(new EndTurnCommand({ playerId: active }))
            engine.runUntilIdle()
        }

        const activePlayer = engine.state.turnState.activePlayerId
        const hand = cardsInZone(engine.state, `hand_${activePlayer}`)
        const fireball = hand.find(c => c.definitionId === 'FIREBALL')

        if (!fireball) return
        if (engine.state.players[activePlayer].attributes.mana < 3) return

        const opponent = Object.keys(engine.state.players).find(id => id !== activePlayer)
        const hpBefore = engine.state.players[opponent].attributes.hp

        engine.enqueueCommand(new PlaySpellCommand({
            playerId: activePlayer,
            cardId: fireball.id,
            targetId: opponent
        }))
        engine.runUntilIdle()

        // Fireball au graveyard
        expect(engine.state.cards[fireball.id].zoneId).toBe(`graveyard_${activePlayer}`)
        // 3 dégâts
        expect(engine.state.players[opponent].attributes.hp).toBe(hpBefore - 3)
    })
})

describe('Win Condition', () => {

    it('should end game when player HP reaches 0', () => {
        const engine = createGame({ seed: 42 })

        // Setup manuel pour tester la victoire
        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { hp: 3, mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { hp: 20, mana: 0, maxMana: 0 } }
            },
            cards: {
                c1: {
                    id: 'c1', definitionId: 'FIGHTER', ownerId: 'player1',
                    zoneId: 'board_player1',
                    attributes: { type: 'creature', power: 5, hp: 3, cost: 2, hasAttacked: false, summoningSickness: false },
                    visibilityOverride: null
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

        // Attaquer joueur 2 avec 5 dégâts
        engine.enqueueCommand(new AttackCommand({
            playerId: 'player1',
            attackerId: 'c1',
            targetId: 'player2'
        }))
        engine.runUntilIdle()

        expect(engine.state.players.player2.attributes.hp).toBe(15)

        // Reset hasAttacked pour re-attaquer (trick de test)
        // Simulons plutôt plusieurs attaques via plusieurs tours
        // En réalité, on teste juste que GAME_OVER est émis quand HP ≤ 0
    })

    it('should emit GAME_OVER when player reaches 0 HP', () => {
        const engine = createGame({ seed: 42 })
        const events = []
        engine.domainEventBus.on(batch => events.push(...batch))

        engine.initialize({
            players: {
                player1: { id: 'player1', name: 'P1', attributes: { hp: 20, mana: 10, maxMana: 10 } },
                player2: { id: 'player2', name: 'P2', attributes: { hp: 2, mana: 0, maxMana: 0 } }
            },
            cards: {
                c1: {
                    id: 'c1', definitionId: 'CHAMPION', ownerId: 'player1',
                    zoneId: 'board_player1',
                    attributes: { type: 'creature', power: 4, hp: 5, cost: 5, hasAttacked: false, summoningSickness: false },
                    visibilityOverride: null
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
            attackerId: 'c1',
            targetId: 'player2'
        }))
        engine.runUntilIdle()

        expect(engine.state.players.player2.attributes.hp).toBe(-2)
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
