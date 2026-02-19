/**
 * IntentResolver — convertit les Intents en Commands.
 *
 * Un Intent est une demande d'action future émise par une Command.
 * L'IntentResolver est un registry configurable par le gameplay :
 * chaque type d'intent est associé à une factory qui produit une Command.
 *
 *   Intent → factory(intent, ctx) → Command
 */

export default class IntentResolver {

    /**
     * @type {Map<string, Function>} intentType → factory(intent, ctx) → Command
     */
    _resolvers;

    constructor() {
        this._resolvers = new Map()
    }

    /**
     * Enregistre une factory pour un type d'intent.
     *
     * @param {string}   intentType - Type d'intent (ex: 'DRAW_CARD')
     * @param {Function} factory    - (intent, ctx) → Command instance
     */
    register(intentType, factory) {
        this._resolvers.set(intentType, factory)
    }

    /**
     * Résout un intent en Command.
     *
     * @param {Object} intent - {type, payload, source}
     * @param {Object} ctx    - Contexte de jeu (state, etc.)
     * @returns {Object|null} Command instance, ou null si pas de resolver
     */
    resolve(intent, ctx) {
        const factory = this._resolvers.get(intent.type)

        if (!factory) {
            return null
        }

        return factory(intent, ctx)
    }

    /**
     * Vérifie si un type d'intent a un resolver enregistré.
     *
     * @param {string} intentType
     * @returns {boolean}
     */
    has(intentType) {
        return this._resolvers.has(intentType)
    }
}
