/**
 * Définitions des cartes (sorts uniquement).
 *
 * Les créatures ont été remplacées par les héros.
 * Chaque définition est un template immuable.
 * Les instances de cartes sont créées au setup avec des IDs uniques.
 */

export const CardType = Object.freeze({
    SPELL: 'spell'
})

/**
 * @type {Object[]} Définitions de toutes les cartes du jeu
 */
export const CARD_DEFINITIONS = Object.freeze([
    {
        id: 'FIREBALL',
        name: 'Fireball',
        type: CardType.SPELL,
        cost: 3,
        effect: 'DEAL_DAMAGE',
        effectPayload: { amount: 3 }
    },
    {
        id: 'HEAL',
        name: 'Heal',
        type: CardType.SPELL,
        cost: 2,
        effect: 'RESTORE_HP',
        effectPayload: { amount: 4 }
    }
])

/**
 * Retrouve une définition par son id.
 *
 * @param {string} definitionId
 * @returns {Object|undefined}
 */
export function getCardDefinition(definitionId) {
    return CARD_DEFINITIONS.find(d => d.id === definitionId)
}
