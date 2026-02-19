/**
 * Resolver — scheduler générique pour les résolutions d'effets.
 *
 * PAS une stack hardcodée à la Magic.
 * C'est une file ordonnée par priorité qui gère :
 * - L'ordre de résolution des intents en attente
 * - La possibilité de pause (pour choix joueur ou animation)
 *
 * Les intents sont triés par priorité (plus bas = résolu d'abord).
 * À priorité égale, l'ordre d'insertion est préservé (FIFO).
 */

export default class Resolver {

    /**
     * @type {Object[]} File des résolutions en attente
     */
    _pending;

    /**
     * @type {number} Compteur d'insertion pour garantir l'ordre FIFO
     */
    _insertionCounter;

    constructor() {
        this._pending = []
        this._insertionCounter = 0
    }

    /**
     * Ajoute un ou plusieurs intents à résoudre.
     *
     * @param {Object[]} intents - Intents avec un champ priority optionnel
     */
    enqueue(intents) {
        for (const intent of intents) {
            this._pending.push({
                intent,
                priority: intent.priority ?? 0,
                order: this._insertionCounter++
            })
        }

        this._sort()
    }

    /**
     * Retire et retourne le prochain intent à résoudre.
     *
     * @returns {Object|null} Intent ou null si vide
     */
    next() {
        if (this._pending.length === 0) {
            return null
        }

        return this._pending.shift().intent
    }

    /**
     * Consulte le prochain intent sans le retirer.
     *
     * @returns {Object|null}
     */
    peek() {
        if (this._pending.length === 0) {
            return null
        }

        return this._pending[0].intent
    }

    /**
     * @returns {boolean}
     */
    get hasPending() {
        return this._pending.length > 0
    }

    /**
     * @returns {number}
     */
    get size() {
        return this._pending.length
    }

    /**
     * Vide la file.
     */
    clear() {
        this._pending = []
    }

    /**
     * Tri par priorité puis par ordre d'insertion.
     */
    _sort() {
        this._pending.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority
            return a.order - b.order
        })
    }
}
