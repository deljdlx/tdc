/**
 * DomainEventBus — collecte et distribue les DomainEvents par batch.
 *
 * Un DomainEvent est un fait passé, immuable et sérialisable.
 * Le bus accumule les events d'un step dans un batch,
 * puis les flush en fin de step.
 *
 * Les listeners reçoivent le batch complet (pas event par event).
 */

export default class DomainEventBus {

    /**
     * @type {Function[]}
     */
    _listeners;

    /**
     * @type {Object[]}
     */
    _currentBatch;

    /**
     * @type {Object[][]}
     */
    _history;

    constructor() {
        this._listeners = []
        this._currentBatch = []
        this._history = []
    }

    /**
     * Enregistre un listener qui sera appelé à chaque flush de batch.
     *
     * @param {Function} listener - Reçoit un tableau de DomainEvents
     * @returns {Function} Fonction de désinscription
     */
    on(listener) {
        this._listeners.push(listener)

        return () => {
            const index = this._listeners.indexOf(listener)
            if (index !== -1) {
                this._listeners.splice(index, 1)
            }
        }
    }

    /**
     * Ajoute un DomainEvent au batch courant.
     *
     * @param {Object} event - {type, payload, sourceCommandType}
     */
    emit(event) {
        this._currentBatch.push(event)
    }

    /**
     * Flush le batch courant : notifie les listeners et archive.
     * Retourne le batch flushed.
     *
     * @returns {Object[]} Le batch qui vient d'être flushed
     */
    flush() {
        const batch = this._currentBatch
        this._currentBatch = []

        if (batch.length > 0) {
            this._history.push(batch)

            for (const listener of this._listeners) {
                listener(batch)
            }
        }

        return batch
    }

    /**
     * Retourne l'historique complet des batches.
     *
     * @returns {Object[][]}
     */
    get history() {
        return this._history
    }

    /**
     * Retourne le batch en cours d'accumulation (pas encore flushed).
     *
     * @returns {Object[]}
     */
    get currentBatch() {
        return this._currentBatch
    }

    /**
     * Réinitialise le bus (utile pour les tests).
     */
    reset() {
        this._listeners = []
        this._currentBatch = []
        this._history = []
    }
}
