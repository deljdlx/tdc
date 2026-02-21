/**
 * CycleDetector — détecte les boucles infinies dans le moteur.
 *
 * Utilise un fingerprint PARTIEL du state (pas de hash deep complet) :
 * - Taille des queues (command + intent)
 * - Index RNG
 * - turnState sérialisé
 * - Nombre d'entités
 *
 * Si le même fingerprint apparaît deux fois, on a un cycle.
 */

export default class CycleDetector {

    /**
     * @type {Set<string>} Fingerprints déjà vus
     */
    _seen;

    /**
     * @type {number} Nombre max de fingerprints gardés en mémoire
     */
    _maxHistory;

    /**
     * @param {Object} options
     * @param {number} [options.maxHistory=1000] - Limite de mémoire
     */
    constructor({ maxHistory = 1000 } = {}) {
        this._seen = new Set()
        this._maxHistory = maxHistory
    }

    /**
     * Génère un fingerprint partiel du state courant.
     *
     * @param {Object}   state           - State du jeu
     * @param {number}   commandQueueLen - Taille de la commandQueue
     * @param {number}   intentQueueLen  - Taille de l'intentQueue
     * @param {number}   rngIndex        - Index courant de la RandomTape
     * @returns {string} Fingerprint sérialisé
     */
    fingerprint(state, commandQueueLen, intentQueueLen, rngIndex) {
        return JSON.stringify({
            turn: state.turnState,
            players: Object.keys(state.players).length,
            cards: Object.keys(state.cards).length,
            heroes: Object.keys(state.heroes || {}).length,
            zones: Object.keys(state.zones).length,
            cq: commandQueueLen,
            iq: intentQueueLen,
            rng: rngIndex
        })
    }

    /**
     * Vérifie si le state courant a déjà été vu.
     * Enregistre le fingerprint si nouveau.
     *
     * @param {Object}   state           - State du jeu
     * @param {number}   commandQueueLen
     * @param {number}   intentQueueLen
     * @param {number}   rngIndex
     * @returns {boolean} true si cycle détecté
     */
    check(state, commandQueueLen, intentQueueLen, rngIndex) {
        const fp = this.fingerprint(state, commandQueueLen, intentQueueLen, rngIndex)

        if (this._seen.has(fp)) {
            return true
        }

        // Évite une croissance mémoire infinie
        if (this._seen.size >= this._maxHistory) {
            this._seen.clear()
        }

        this._seen.add(fp)
        return false
    }

    /**
     * Réinitialise l'historique des fingerprints.
     */
    reset() {
        this._seen.clear()
    }
}
