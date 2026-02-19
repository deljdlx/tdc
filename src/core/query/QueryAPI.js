/**
 * QueryAPI — accès en lecture seule au state du jeu.
 *
 * Toute règle gameplay qui a besoin de lire le state
 * DOIT passer par QueryAPI. Pas d'accès direct au state.
 *
 * Applique les modifiers continus (ModifierRegistry) lors de la lecture.
 * Cache par (entityId, attribute), invalidé quand la version du state change.
 */

import ModifierRegistry from './ModifierRegistry.js'

export default class QueryAPI {

    /**
     * @type {Object} Référence au state courant (lecture seule)
     */
    _state;

    /**
     * @type {Object} ZoneTypeRegistry pour résoudre la visibilité
     */
    _zoneTypeRegistry;

    /**
     * @type {ModifierRegistry} Registre des modifiers continus
     */
    _modifierRegistry;

    /**
     * @type {Map<string, *>} Cache des valeurs calculées
     */
    _cache;

    /**
     * @type {number} Version du state au moment du remplissage du cache
     */
    _cacheVersion;

    /**
     * @param {Object} state            - State courant
     * @param {Object} zoneTypeRegistry - Registry des ZoneTypes
     */
    constructor(state, zoneTypeRegistry) {
        this._state = state
        this._zoneTypeRegistry = zoneTypeRegistry
        this._modifierRegistry = new ModifierRegistry()
        this._cache = new Map()
        this._cacheVersion = -1
    }

    /**
     * Met à jour la référence au state (appelé par l'Engine après chaque patch).
     *
     * @param {Object} state
     */
    updateState(state) {
        this._state = state
    }

    /**
     * @returns {ModifierRegistry}
     */
    get modifierRegistry() {
        return this._modifierRegistry
    }

    /**
     * Lit la valeur effective d'un attribut d'une entité.
     * Applique tous les modifiers actifs, dans l'ordre des layers.
     *
     * Utilise un cache invalidé quand la version du state change.
     *
     * @param {string} entityId - ID de l'entité (player ou card)
     * @param {string} key      - Clé de l'attribut
     * @returns {*} Valeur effective (base + modifiers)
     */
    query(entityId, key) {
        // Invalider le cache si le state a changé
        const currentVersion = this._state.version ?? -1
        if (this._cacheVersion !== currentVersion) {
            this._cache.clear()
            this._cacheVersion = currentVersion
        }

        // Vérifier le cache
        const cacheKey = `${entityId}:${key}`
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey)
        }

        // Valeur de base
        let value = this._getBaseValue(entityId, key)

        // Appliquer les modifiers
        const modifiers = this._modifierRegistry.getModifiersFor(
            entityId, key, this._state
        )

        for (const modifier of modifiers) {
            value = modifier.apply(value, entityId, this._state)
        }

        // Mettre en cache
        this._cache.set(cacheKey, value)
        return value
    }

    /**
     * Force l'invalidation du cache (utile après ajout/suppression de modifier).
     */
    invalidateCache() {
        this._cache.clear()
        this._cacheVersion = -1
    }

    /**
     * Retourne le propriétaire d'une entité.
     *
     * @param {string} entityId - ID d'une card ou zone
     * @returns {string|null} ownerId ou null
     */
    getOwner(entityId) {
        const card = this._state.cards[entityId]
        if (card) {
            return card.ownerId
        }

        const zone = this._state.zones[entityId]
        if (zone) {
            return zone.ownerId
        }

        return null
    }

    /**
     * Détermine si une carte est visible pour un joueur donné.
     *
     * Règles :
     * 1. Si card.visibilityOverride != null → utiliser l'override
     * 2. Sinon → utiliser la visibilité du ZoneType
     *
     * @param {string} cardId   - ID de la carte
     * @param {string} playerId - ID du joueur
     * @returns {boolean}
     */
    isVisibleTo(cardId, playerId) {
        const card = this._state.cards[cardId]
        if (!card) {
            return false
        }

        let visibility = null

        if (card.visibilityOverride != null) {
            visibility = card.visibilityOverride
        } else {
            const zone = this._state.zones[card.zoneId]
            if (zone) {
                const zoneType = this._zoneTypeRegistry.get(zone.zoneTypeId)
                if (zoneType) {
                    visibility = zoneType.visibility
                }
            }
        }

        if (visibility === 'public') {
            return true
        }

        if (visibility === 'owner') {
            const zone = this._state.zones[card.zoneId]
            return zone ? zone.ownerId === playerId : false
        }

        return false
    }

    /**
     * Retourne les cartes présentes dans une zone.
     *
     * @param {string} zoneId
     * @returns {Object[]}
     */
    getCardsInZone(zoneId) {
        return Object.values(this._state.cards)
            .filter(card => card.zoneId === zoneId)
    }

    /**
     * Accès direct en lecture au state (pour les Commands).
     *
     * @returns {Object}
     */
    get state() {
        return this._state
    }

    /**
     * Lit la valeur brute (sans modifiers) d'un attribut.
     *
     * @param {string} entityId
     * @param {string} key
     * @returns {*}
     */
    _getBaseValue(entityId, key) {
        const entity =
            this._state.players[entityId] ||
            this._state.cards[entityId]

        if (!entity) {
            return undefined
        }

        return entity.attributes ? entity.attributes[key] : undefined
    }
}
