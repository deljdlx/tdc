/**
 * RuntimeBus — bus technique pour l'UI et le debug.
 *
 * Même interface que DomainEventBus, mais :
 * - N'influence JAMAIS le replay
 * - N'est pas sérialisé
 * - Sert uniquement à notifier l'UI, les logs, le debug
 *
 * Events typiques : 'step:start', 'step:end', 'command:rejected', etc.
 */

export default class RuntimeBus {

    /**
     * @type {Map<string, Function[]>}
     */
    _listeners;

    constructor() {
        this._listeners = new Map()
    }

    /**
     * Enregistre un listener pour un type d'event technique.
     *
     * @param {string}   eventType - Type d'event (ex: 'step:end')
     * @param {Function} listener  - Callback recevant les données de l'event
     * @returns {Function} Fonction de désinscription
     */
    on(eventType, listener) {
        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, [])
        }

        this._listeners.get(eventType).push(listener)

        return () => {
            const list = this._listeners.get(eventType)
            if (list) {
                const index = list.indexOf(listener)
                if (index !== -1) {
                    list.splice(index, 1)
                }
            }
        }
    }

    /**
     * Émet un event technique. Fire-and-forget.
     *
     * @param {string} eventType - Type d'event
     * @param {*}      data      - Données associées
     */
    emit(eventType, data) {
        const list = this._listeners.get(eventType)
        if (list) {
            for (const listener of list) {
                listener(data)
            }
        }
    }

    /**
     * Réinitialise le bus (utile pour les tests).
     */
    reset() {
        this._listeners = new Map()
    }
}
