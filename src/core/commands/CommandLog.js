/**
 * CommandLog — journal ordonné des commands exécutées.
 *
 * Enregistre chaque command (type + payload) dans l'ordre d'exécution.
 * Le CommandLog est une des deux sources de vérité pour le replay
 * (avec la RandomTape).
 *
 * Les commands rejetées (COMMAND_REJECTED) sont aussi loggées
 * pour que le replay les rejoue et les skip de façon identique.
 */

export default class CommandLog {

    /**
     * @type {Object[]} Liste ordonnée des entries
     */
    _entries;

    /**
     * @type {number} Index de lecture pour le replay
     */
    _replayIndex;

    constructor() {
        this._entries = []
        this._replayIndex = 0
    }

    /**
     * Enregistre une command exécutée.
     *
     * @param {Object} entry
     * @param {string} entry.type    - Type de la command (ex: 'PLAY_CARD')
     * @param {Object} entry.payload - Payload de la command
     */
    record(entry) {
        this._entries.push({
            type: entry.type,
            payload: entry.payload
        })
    }

    /**
     * Retourne toutes les entries enregistrées.
     *
     * @returns {Object[]}
     */
    get entries() {
        return this._entries
    }

    /**
     * Nombre de commands enregistrées.
     *
     * @returns {number}
     */
    get length() {
        return this._entries.length
    }

    /**
     * Charge un log existant (pour le replay).
     *
     * @param {Object[]} entries
     */
    load(entries) {
        this._entries = entries.map(e => ({ type: e.type, payload: e.payload }))
        this._replayIndex = 0
    }

    /**
     * Retourne la prochaine entry à rejouer, ou null si terminé.
     *
     * @returns {Object|null}
     */
    nextReplayEntry() {
        if (this._replayIndex >= this._entries.length) {
            return null
        }
        return this._entries[this._replayIndex++]
    }

    /**
     * @returns {number}
     */
    get replayIndex() {
        return this._replayIndex
    }

    /**
     * Réinitialise le log.
     */
    reset() {
        this._entries = []
        this._replayIndex = 0
    }
}
