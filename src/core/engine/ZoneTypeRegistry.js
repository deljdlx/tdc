/**
 * ZoneTypeRegistry — registre des types de zones du jeu.
 *
 * Chaque ZoneType déclare des propriétés par défaut :
 * ordered, visibility, maxSize.
 *
 * Les ZoneTypes sont enregistrés AVANT le début de la partie
 * et sont immuables pendant le jeu.
 */

export default class ZoneTypeRegistry {

    /**
     * @type {Map<string, Object>} id → ZoneType
     */
    _types;

    constructor() {
        this._types = new Map()
    }

    /**
     * Enregistre un ZoneType.
     *
     * @param {Object}  zoneType
     * @param {string}  zoneType.id         - Identifiant unique (ex: 'deck')
     * @param {boolean} zoneType.ordered    - Les cartes ont-elles un index ?
     * @param {string}  zoneType.visibility - 'public' | 'owner' | 'hidden'
     * @param {number|null} zoneType.maxSize - Limite de cartes (null = illimité)
     * @throws {Error} Si l'id est déjà enregistré
     */
    register(zoneType) {
        if (this._types.has(zoneType.id)) {
            throw new Error(
                `ZoneTypeRegistry: type "${zoneType.id}" is already registered`
            )
        }

        // Freeze pour garantir l'immuabilité
        this._types.set(zoneType.id, Object.freeze({ ...zoneType }))
    }

    /**
     * Retourne un ZoneType par son id.
     *
     * @param {string} id
     * @returns {Object|undefined}
     */
    get(id) {
        return this._types.get(id)
    }

    /**
     * Vérifie si un ZoneType est enregistré.
     *
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this._types.has(id)
    }
}
