/**
 * IdGenerator — génération d'identifiants déterministes.
 *
 * Utilise un compteur simple (pas d'UUID) pour garantir
 * que les IDs sont identiques entre partie live et replay.
 *
 * Format : prefix_001, prefix_002, ...
 */

export default class IdGenerator {

    /**
     * @type {number} Compteur courant
     */
    _counter;

    /**
     * @param {number} [startAt=0] - Valeur initiale du compteur
     */
    constructor(startAt = 0) {
        this._counter = startAt
    }

    /**
     * Génère le prochain ID avec un préfixe donné.
     *
     * @param {string} prefix - Préfixe (ex: 'card', 'zone')
     * @returns {string} ID formaté (ex: 'card_001')
     */
    next(prefix) {
        this._counter++
        const padded = String(this._counter).padStart(3, '0')
        return `${prefix}_${padded}`
    }

    /**
     * @returns {number} Valeur courante du compteur
     */
    get counter() {
        return this._counter
    }
}
