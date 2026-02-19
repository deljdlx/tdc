/**
 * ModifierRegistry — registre des modifiers continus.
 *
 * Un modifier transforme la valeur d'un attribut d'entité
 * au moment de la lecture (via QueryAPI.query()).
 *
 * Les modifiers sont triés par layer (ordre d'application)
 * puis par timestamp (tiebreaker déterministe dans le même layer).
 *
 * Exemple de modifier :
 *   {
 *     id: 'buff_001',
 *     attribute: 'power',
 *     layer: 1,
 *     timestamp: 42,
 *     condition: (entityId, state) => state.cards[entityId]?.ownerId === 'p1',
 *     apply: (value) => value + 1
 *   }
 */

export default class ModifierRegistry {

    /**
     * @type {Map<string, Object>} id → modifier
     */
    _modifiers;

    /**
     * @type {Object[]|null} Cache trié, invalidé à chaque mutation
     */
    _sortedCache;

    constructor() {
        this._modifiers = new Map()
        this._sortedCache = null
    }

    /**
     * Enregistre un modifier.
     *
     * @param {Object}   modifier
     * @param {string}   modifier.id        - Identifiant unique
     * @param {string}   modifier.attribute  - Attribut ciblé (ex: 'power')
     * @param {number}   modifier.layer      - Ordre d'application (plus bas = appliqué d'abord)
     * @param {number}   modifier.timestamp  - Tiebreaker déterministe
     * @param {Function} modifier.condition  - (entityId, state) → boolean
     * @param {Function} modifier.apply      - (currentValue, entityId, state) → newValue
     */
    register(modifier) {
        this._modifiers.set(modifier.id, modifier)
        this._sortedCache = null
    }

    /**
     * Supprime un modifier par son id.
     *
     * @param {string} id
     */
    remove(id) {
        this._modifiers.delete(id)
        this._sortedCache = null
    }

    /**
     * Retourne tous les modifiers applicables à un (entityId, attribute),
     * triés par layer puis timestamp.
     *
     * @param {string} entityId
     * @param {string} attribute
     * @param {Object} state
     * @returns {Object[]}
     */
    getModifiersFor(entityId, attribute, state) {
        return this._getSorted()
            .filter(m => m.attribute === attribute && m.condition(entityId, state))
    }

    /**
     * Supprime tous les modifiers.
     */
    clear() {
        this._modifiers.clear()
        this._sortedCache = null
    }

    /**
     * @returns {number} Nombre de modifiers enregistrés
     */
    get size() {
        return this._modifiers.size
    }

    /**
     * Retourne la liste triée (avec cache).
     *
     * @returns {Object[]}
     */
    _getSorted() {
        if (!this._sortedCache) {
            this._sortedCache = [...this._modifiers.values()].sort((a, b) => {
                if (a.layer !== b.layer) return a.layer - b.layer
                return a.timestamp - b.timestamp
            })
        }
        return this._sortedCache
    }
}
