/**
 * StartGameCommand — initialise la partie.
 *
 * Crée les zones, génère les decks, distribue les mains initiales.
 * Tour 1 : Joueur 1 pioche 3, Joueur 2 pioche 4.
 */

import { CARD_DEFINITIONS } from '../definitions/cards.js'
import { HERO_DEFINITIONS } from '../definitions/heroes.js'

const DECK_SIZE = 15
const HEROES_PER_PLAYER = 2
const ZONE_TYPES = ['deck', 'hand', 'board', 'graveyard']

export default class StartGameCommand {
    static type = 'START_GAME'
    static category = 'game_flow'
    static edges = [
        { target: 'DRAW_CARDS', label: 'DRAW_CARDS' }
    ]

    constructor(payload) {
        this.payload = payload || {}
    }

    validate(state) {
        if (state.turnState.turnNumber !== 0) {
            return { valid: false, reason: 'Game already started' }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const patches = []
        const domainEvents = []
        const intents = []
        const playerIds = Object.keys(state.players)

        // Créer les zones pour chaque joueur
        for (const playerId of playerIds) {
            for (const zoneType of ZONE_TYPES) {
                const zoneId = `${zoneType}_${playerId}`
                patches.push({
                    type: 'CREATE_ENTITY',
                    target: zoneId,
                    payload: {
                        entityType: 'zone',
                        data: { zoneTypeId: zoneType, ownerId: playerId }
                    }
                })
            }
        }

        // Initialiser les attributs des joueurs (mana pour les sorts)
        for (const playerId of playerIds) {
            patches.push(
                { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'mana', value: 0 } },
                { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'maxMana', value: 0 } }
            )
        }

        // Creer les heros pour chaque joueur
        for (const playerId of playerIds) {
            for (let i = 0; i < HEROES_PER_PLAYER; i++) {
                const defIndex = ctx.random.nextInt(0, HERO_DEFINITIONS.length - 1)
                const def = HERO_DEFINITIONS[defIndex]
                const heroId = ctx.idGenerator.next('hero')

                patches.push({
                    type: 'CREATE_ENTITY',
                    target: heroId,
                    payload: {
                        entityType: 'hero',
                        data: {
                            heroDefId: def.id,
                            playerId,
                            attributes: {
                                hp: def.hp,
                                maxHp: def.hp,
                                power: def.power,
                                ap: 0,
                                maxAp: def.maxAp,
                                mana: 0,
                                maxMana: 0,
                                speed: def.speed,
                                hasActed: false,
                                armor: 0,
                                isDefending: false,
                                activeBuffs: '[]'
                            }
                        }
                    }
                })
            }
        }

        // Générer les decks (15 cartes random par joueur)
        for (const playerId of playerIds) {
            for (let i = 0; i < DECK_SIZE; i++) {
                const defIndex = ctx.random.nextInt(0, CARD_DEFINITIONS.length - 1)
                const def = CARD_DEFINITIONS[defIndex]
                const cardId = ctx.idGenerator.next('card')
                const zoneId = `deck_${playerId}`

                patches.push({
                    type: 'CREATE_ENTITY',
                    target: cardId,
                    payload: {
                        entityType: 'card',
                        data: {
                            definitionId: def.id,
                            ownerId: playerId,
                            zoneId,
                            attributes: {
                                cost: def.cost,
                                ...(def.effect ? { effect: def.effect, effectPayload: JSON.stringify(def.effectPayload) } : {}),
                                type: def.type
                            },
                            visibilityOverride: null
                        }
                    }
                })
            }
        }

        // Tour 1 : joueur 1 actif
        patches.push(
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'activePlayerId', value: playerIds[0] } },
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'turnNumber', value: 1 } },
            { type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'phase', value: 'main' } }
        )

        // Distribuer les mains : J1 pioche 3, J2 pioche 4
        intents.push(
            { type: 'DRAW_CARDS', payload: { playerId: playerIds[0], count: 3 }, source: 'START_GAME' },
            { type: 'DRAW_CARDS', payload: { playerId: playerIds[1], count: 4 }, source: 'START_GAME' }
        )

        // Donner 3 mana au J1 pour son premier tour (permet de jouer la plupart des cartes)
        patches.push(
            { type: 'SET_ATTRIBUTE', target: playerIds[0], payload: { key: 'maxMana', value: 3 } },
            { type: 'SET_ATTRIBUTE', target: playerIds[0], payload: { key: 'mana', value: 3 } }
        )

        domainEvents.push({
            type: 'GAME_STARTED',
            payload: { playerIds },
            sourceCommandType: 'START_GAME'
        })

        return { patches, domainEvents, intents }
    }
}
