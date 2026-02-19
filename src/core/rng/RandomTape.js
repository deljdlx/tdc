/**
 * RandomTape — source de hasard déterministe.
 *
 * En mode RECORD (partie live) :
 *   - next() génère un nombre via le PRNG interne et l'enregistre dans la tape.
 *
 * En mode REPLAY :
 *   - next() lit la valeur suivante depuis la tape pré-remplie.
 *   - Si la tape est épuisée, throw (désynchronisation).
 *
 * Le PRNG utilise un Mulberry32 seedé pour la reproductibilité.
 */

/**
 * Mulberry32 — PRNG simple, rapide, seedé.
 * Retourne une fonction () → number dans [0, 1).
 *
 * @param {number} seed
 * @returns {function(): number}
 */
function mulberry32(seed) {
    let s = seed | 0
    return () => {
        s = (s + 0x6D2B79F5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export default class RandomTape {

    /**
     * @type {number[]} Liste des valeurs RNG consommées
     */
    _tape;

    /**
     * @type {number} Index de lecture courant
     */
    _index;

    /**
     * @type {boolean} true = replay depuis tape existante
     */
    _replayMode;

    /**
     * @type {function(): number} PRNG seedé (Mulberry32)
     */
    _prng;

    /**
     * @param {Object}   options
     * @param {number}   options.seed       - Seed pour le PRNG (mode record)
     * @param {number[]} [options.tape]     - Tape pré-enregistrée (mode replay)
     */
    constructor({ seed, tape = null }) {
        this._prng = mulberry32(seed)
        this._index = 0

        if (tape) {
            this._tape = [...tape]
            this._replayMode = true
        } else {
            this._tape = []
            this._replayMode = false
        }
    }

    /**
     * Retourne la prochaine valeur aléatoire dans [0, 1).
     *
     * En mode record : génère et enregistre.
     * En mode replay : lit depuis la tape.
     *
     * @returns {number} Valeur dans [0, 1)
     * @throws {Error} En replay si la tape est épuisée
     */
    next() {
        if (this._replayMode) {
            if (this._index >= this._tape.length) {
                throw new Error(
                    `RandomTape: tape exhausted at index ${this._index} (tape length: ${this._tape.length})`
                )
            }
            return this._tape[this._index++]
        }

        const value = this._prng()
        this._tape.push(value)
        this._index++
        return value
    }

    /**
     * Retourne un entier dans [min, max] inclus.
     *
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    nextInt(min, max) {
        const raw = this.next()
        return min + Math.floor(raw * (max - min + 1))
    }

    /**
     * @returns {number[]} Copie de la tape enregistrée
     */
    get tape() {
        return [...this._tape]
    }

    /**
     * @returns {number} Index de lecture courant
     */
    get index() {
        return this._index
    }

    /**
     * @returns {boolean}
     */
    get replayMode() {
        return this._replayMode
    }
}
