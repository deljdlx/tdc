/**
 * ChoiceSystem — gère les demandes de choix joueur.
 *
 * Quand une Command ou un effet a besoin d'un input joueur :
 * 1. L'effet émet un intent REQUEST_CHOICE
 * 2. L'IntentResolver le convertit en ChoiceRequestCommand (interne)
 * 3. Le ChoiceSystem enregistre le choix en attente
 * 4. Le moteur se met en pause (CHOICE_REQUESTED event)
 * 5. L'UI soumet un ProvideChoiceCommand avec la sélection du joueur
 * 6. Le ChoiceSystem résout le choix et émet les intents de suite
 *
 * Les selectors sont sérialisables (objets de données, pas de fonctions).
 *
 * Selector :
 *   {
 *     type:   'TARGET_ENTITY' | 'TARGET_PLAYER' | 'SELECT_CARD' | ...
 *     filter: object (critères sérialisables)
 *   }
 */

export default class ChoiceSystem {

    /**
     * @type {Object|null} Choix en attente de résolution
     */
    _pendingChoice;

    /**
     * @type {number} Compteur pour les IDs de choix
     */
    _nextChoiceId;

    constructor() {
        this._pendingChoice = null
        this._nextChoiceId = 1
    }

    /**
     * Enregistre un nouveau choix en attente.
     *
     * @param {Object} spec
     * @param {string} spec.playerId  - Joueur qui doit choisir
     * @param {Object} spec.selector  - Critères de sélection (sérialisable)
     * @param {string} spec.source    - Origine du choix (commandType ou effectId)
     * @param {Object} [spec.context] - Données contextuelles pour résoudre le choix
     * @returns {string} choiceId
     */
    requestChoice(spec) {
        const choiceId = `choice_${this._nextChoiceId++}`

        this._pendingChoice = {
            choiceId,
            playerId: spec.playerId,
            selector: spec.selector,
            source: spec.source,
            context: spec.context || {}
        }

        return choiceId
    }

    /**
     * Résout le choix en attente avec la sélection du joueur.
     *
     * @param {string} choiceId  - ID du choix à résoudre
     * @param {*}      selection - Valeur sélectionnée par le joueur
     * @returns {{ resolved: boolean, choice: Object|null }}
     */
    provideChoice(choiceId, selection) {
        if (!this._pendingChoice || this._pendingChoice.choiceId !== choiceId) {
            return { resolved: false, choice: null }
        }

        const choice = {
            ...this._pendingChoice,
            selection
        }

        this._pendingChoice = null

        return { resolved: true, choice }
    }

    /**
     * @returns {Object|null} Le choix en attente, ou null
     */
    get pendingChoice() {
        return this._pendingChoice
    }

    /**
     * @returns {boolean}
     */
    get hasPendingChoice() {
        return this._pendingChoice !== null
    }

    /**
     * Réinitialise le système.
     */
    reset() {
        this._pendingChoice = null
        this._nextChoiceId = 1
    }
}
