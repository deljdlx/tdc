/**
 * PatchApplier — applique un patch typé sur le state et retourne un nouveau state.
 *
 * Aucune mutation directe : chaque patch produit une copie partielle.
 * Les types inconnus provoquent un throw (erreur fatale moteur).
 */

/**
 * @typedef {Object} Patch
 * @property {string} type    - Nom de l'opération (ex: SET_ATTRIBUTE)
 * @property {string} target  - entityId ou path concerné
 * @property {Object} payload - Données spécifiques au type
 */

/**
 * Table des handlers de patch.
 * Chaque handler reçoit (state, target, payload) et retourne un nouveau state.
 *
 * @type {Object.<string, function(Object, string, Object): Object>}
 */
const PATCH_HANDLERS = {

    /**
     * SET_ATTRIBUTE — modifie un attribut d'une entité (player ou card).
     * payload: {key, value}
     */
    SET_ATTRIBUTE(state, target, { key, value }) {
        // Cherche dans players puis dans cards
        if (state.players[target]) {
            return {
                ...state,
                players: {
                    ...state.players,
                    [target]: {
                        ...state.players[target],
                        attributes: {
                            ...state.players[target].attributes,
                            [key]: value
                        }
                    }
                }
            }
        }

        if (state.cards[target]) {
            return {
                ...state,
                cards: {
                    ...state.cards,
                    [target]: {
                        ...state.cards[target],
                        attributes: {
                            ...state.cards[target].attributes,
                            [key]: value
                        }
                    }
                }
            }
        }

        throw new Error(`SET_ATTRIBUTE: entity "${target}" not found`)
    },

    /**
     * MOVE_CARD — déplace une carte d'une zone à une autre.
     * payload: {fromZoneId, toZoneId, index?}
     */
    MOVE_CARD(state, target, { fromZoneId, toZoneId, index: _index }) {
        const card = state.cards[target]
        if (!card) {
            throw new Error(`MOVE_CARD: card "${target}" not found`)
        }

        if (card.zoneId !== fromZoneId) {
            throw new Error(
                `MOVE_CARD: card "${target}" is in zone "${card.zoneId}", not "${fromZoneId}"`
            )
        }

        return {
            ...state,
            cards: {
                ...state.cards,
                [target]: {
                    ...card,
                    zoneId: toZoneId
                }
            }
        }
    },

    /**
     * CREATE_ENTITY — crée une nouvelle entité dans le state.
     * payload: {entityType, data}
     */
    CREATE_ENTITY(state, target, { entityType, data }) {
        const collectionKey = ENTITY_TYPE_TO_COLLECTION[entityType]
        if (!collectionKey) {
            throw new Error(`CREATE_ENTITY: unknown entityType "${entityType}"`)
        }

        return {
            ...state,
            [collectionKey]: {
                ...state[collectionKey],
                [target]: { id: target, ...data }
            }
        }
    },

    /**
     * REMOVE_ENTITY — supprime une entité du state.
     * target = entityId
     */
    REMOVE_ENTITY(state, target) {
        // Cherche dans chaque collection
        for (const collectionKey of ['players', 'cards', 'zones']) {
            if (state[collectionKey][target]) {
                const { [target]: _discarded, ...rest } = state[collectionKey]
                return {
                    ...state,
                    [collectionKey]: rest
                }
            }
        }

        throw new Error(`REMOVE_ENTITY: entity "${target}" not found`)
    },

    /**
     * SET_TURN_STATE — modifie un champ du turnState.
     * payload: {field, value}
     */
    SET_TURN_STATE(state, _target, { field, value }) {
        return {
            ...state,
            turnState: {
                ...state.turnState,
                [field]: value
            }
        }
    },

    /**
     * SET_VISIBILITY_OVERRIDE — modifie la visibilité d'une carte.
     * payload: {visibility: 'hidden' | 'public' | null}
     */
    SET_VISIBILITY_OVERRIDE(state, target, { visibility }) {
        const card = state.cards[target]
        if (!card) {
            throw new Error(`SET_VISIBILITY_OVERRIDE: card "${target}" not found`)
        }

        return {
            ...state,
            cards: {
                ...state.cards,
                [target]: {
                    ...card,
                    visibilityOverride: visibility
                }
            }
        }
    }
}

/**
 * Mapping entityType → clé de collection dans le state.
 */
const ENTITY_TYPE_TO_COLLECTION = {
    player: 'players',
    card: 'cards',
    zone: 'zones'
}

export default class PatchApplier {

    /**
     * Applique un patch sur le state et retourne un nouveau state.
     *
     * @param {Object} state - Le state courant (ne sera pas muté)
     * @param {Patch}  patch - Le patch à appliquer
     * @returns {Object} Nouveau state avec le patch appliqué
     * @throws {Error} Si le type de patch est inconnu ou si la cible est introuvable
     */
    apply(state, patch) {
        const handler = PATCH_HANDLERS[patch.type]

        if (!handler) {
            throw new Error(`PatchApplier: unknown patch type "${patch.type}"`)
        }

        return handler(state, patch.target, patch.payload || {})
    }

    /**
     * Applique une liste de patches séquentiellement.
     *
     * @param {Object}  state   - Le state courant
     * @param {Patch[]} patches - Liste ordonnée de patches
     * @returns {Object} Nouveau state après application de tous les patches
     */
    applyAll(state, patches) {
        return patches.reduce((s, patch) => this.apply(s, patch), state)
    }
}
