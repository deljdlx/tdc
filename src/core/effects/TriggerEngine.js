/**
 * TriggerEngine — réagit aux DomainEvents pour émettre des intents.
 *
 * Un trigger surveille les DomainEvents et produit des intents
 * quand ses conditions sont remplies.
 *
 * Chaque trigger est un objet :
 *   {
 *     id:        string,
 *     eventType: string           (type de DomainEvent à surveiller)
 *     condition: (event, state) → boolean
 *     createIntent: (event, state) → Intent
 *   }
 *
 * Le TriggerEngine se branche sur le DomainEventBus et collecte
 * les intents générés. L'Engine récupère ces intents après chaque step.
 */

export default class TriggerEngine {

    /**
     * @type {Map<string, Object>} id → trigger
     */
    _triggers;

    /**
     * @type {Object[]} Intents générés en attente de récupération
     */
    _pendingIntents;

    constructor() {
        this._triggers = new Map()
        this._pendingIntents = []
    }

    /**
     * Enregistre un trigger.
     *
     * @param {Object} trigger
     */
    register(trigger) {
        this._triggers.set(trigger.id, trigger)
    }

    /**
     * Supprime un trigger.
     *
     * @param {string} id
     */
    remove(id) {
        this._triggers.delete(id)
    }

    /**
     * Traite un batch de DomainEvents.
     * Pour chaque event, vérifie tous les triggers et collecte les intents.
     *
     * @param {Object[]} eventBatch - Batch de DomainEvents
     * @param {Object}   state      - State courant du jeu
     */
    processBatch(eventBatch, state) {
        for (const event of eventBatch) {
            for (const trigger of this._triggers.values()) {
                if (trigger.eventType === event.type && trigger.condition(event, state)) {
                    const intent = trigger.createIntent(event, state)
                    if (intent) {
                        this._pendingIntents.push(intent)
                    }
                }
            }
        }
    }

    /**
     * Récupère et vide les intents en attente.
     *
     * @returns {Object[]}
     */
    flush() {
        const intents = this._pendingIntents
        this._pendingIntents = []
        return intents
    }

    /**
     * @returns {boolean}
     */
    get hasPending() {
        return this._pendingIntents.length > 0
    }

    /**
     * Réinitialise tous les triggers et intents.
     */
    reset() {
        this._triggers.clear()
        this._pendingIntents = []
    }
}
