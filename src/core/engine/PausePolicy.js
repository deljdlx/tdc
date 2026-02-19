/**
 * PausePolicy — décide si le moteur doit se mettre en pause après un step.
 *
 * Inspecte le DomainEventBatch produit par le step courant
 * et retourne un éventuel pauseHint.
 *
 * Le gameplay peut enregistrer des règles de pause.
 * Exemples : pause après un choix joueur, pause pour animation.
 */

export default class PausePolicy {

    /**
     * @type {Function[]} Liste de rules (batch) → pauseHint | null
     */
    _rules;

    constructor() {
        this._rules = []
    }

    /**
     * Ajoute une règle de pause.
     *
     * @param {Function} rule - (eventBatch) → string|null
     *   Retourne un pauseHint (string) si pause, null sinon.
     */
    addRule(rule) {
        this._rules.push(rule)
    }

    /**
     * Évalue le batch d'events et retourne le premier pauseHint trouvé.
     *
     * @param {Object[]} eventBatch - DomainEvents du step courant
     * @returns {string|null} pauseHint ou null
     */
    evaluate(eventBatch) {
        for (const rule of this._rules) {
            const hint = rule(eventBatch)
            if (hint) {
                return hint
            }
        }

        return null
    }
}
