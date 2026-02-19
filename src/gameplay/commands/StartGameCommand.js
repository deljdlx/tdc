/**
 * StartGameCommand — initialise la partie.
 *
 * Crée les zones, génère les decks, distribue les mains initiales.
 * Tour 1 : Joueur 1 pioche 3, Joueur 2 pioche 4.
 */

import { CARD_DEFINITIONS } from '../definitions/cards.js'

const DECK_SIZE = 15
const ZONE_TYPES = ['deck', 'hand', 'board', 'graveyard']

export default class StartGameCommand {
    static type = 'START_GAME'

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

        // Initialiser les attributs des joueurs
        for (const playerId of playerIds) {
            patches.push(
                { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'hp', value: 20 } },
                { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'mana', value: 0 } },
                { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'maxMana', value: 0 } }
            )
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
                                ...(def.power != null ? { power: def.power } : {}),
                                ...(def.hp != null ? { hp: def.hp } : {}),
                                ...(def.effect ? { effect: def.effect, effectPayload: JSON.stringify(def.effectPayload) } : {}),
                                type: def.type,
                                hasAttacked: false,
                                summoningSickness: false
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
