/**
 * Formatters d'affichage pour les types d'effets.
 *
 * Chaque entrée mappe un type d'effet vers une fonction
 * (value) => string pour l'affichage humain.
 */

export const EFFECT_LABELS = Object.freeze({
    DEAL_DAMAGE: (v) => `Deal ${v} damage`,
    RESTORE_HP: (v) => `Restore ${v} HP`
})
