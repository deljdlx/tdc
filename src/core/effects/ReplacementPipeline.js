/**
 * ReplacementPipeline — intercepte le résultat d'une Command et le transforme ou l'annule.
 *
 * Un replacement effect modifie ce qui se passe "au lieu de" l'action normale.
 * Exemple : "Au lieu de subir des dégâts, gagnez autant de points de vie."
 *
 * Chaque replacement est un objet sérialisable-compatible :
 *   {
 *     id:        string,
 *     priority:  number  (plus bas = évalué d'abord)
 *     condition: (commandType, result, state) → boolean
 *     apply:     (result, state) → { patches, domainEvents, intents } | null
 *       → retourne null pour VETO (annule la command)
 *       → retourne un result modifié sinon
 *   }
 *
 * Les replacements sont appliqués dans l'ordre de priorité.
 * Un seul replacement peut s'appliquer par command (le premier qui match).
 */

export default class ReplacementPipeline {

    /**
     * @type {Map<string, Object>} id → replacement
     */
    _replacements;

    /**
     * @type {Object[]|null} Cache trié
     */
    _sortedCache;

    constructor() {
        this._replacements = new Map()
        this._sortedCache = null
    }

    /**
     * Enregistre un replacement effect.
     *
     * @param {Object} replacement
     */
    register(replacement) {
        this._replacements.set(replacement.id, replacement)
        this._sortedCache = null
    }

    /**
     * Supprime un replacement effect.
     *
     * @param {string} id
     */
    remove(id) {
        this._replacements.delete(id)
        this._sortedCache = null
    }

    /**
     * Applique la pipeline sur le résultat d'une Command.
     *
     * @param {string} commandType - Type de la command
     * @param {Object} result      - {patches, domainEvents, intents}
     * @param {Object} state       - State courant
     * @returns {{ result: Object|null, replaced: boolean, replacementId: string|null }}
     *   - result = null si VETO
     *   - replaced = true si un replacement a été appliqué
     */
    process(commandType, result, state) {
        const sorted = this._getSorted()

        for (const replacement of sorted) {
            if (replacement.condition(commandType, result, state)) {
                const modified = replacement.apply(result, state)
                return {
                    result: modified,
                    replaced: true,
                    replacementId: replacement.id
                }
            }
        }

        // Aucun replacement, on laisse passer tel quel
        return { result, replaced: false, replacementId: null }
    }

    /**
     * @returns {number}
     */
    get size() {
        return this._replacements.size
    }

    /**
     * Réinitialise la pipeline.
     */
    reset() {
        this._replacements.clear()
        this._sortedCache = null
    }

    /**
     * @returns {Object[]}
     */
    _getSorted() {
        if (!this._sortedCache) {
            this._sortedCache = [...this._replacements.values()]
                .sort((a, b) => a.priority - b.priority)
        }
        return this._sortedCache
    }
}
