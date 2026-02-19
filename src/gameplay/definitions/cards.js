/**
 * Définitions des cartes du scénario Hearthstone simplifié.
 *
 * 5 créatures + 2 sorts = 7 cartes.
 * Chaque définition est un template immuable.
 * Les instances de cartes sont créées au setup avec des IDs uniques.
 */

export const CardType = Object.freeze({
    CREATURE: 'creature',
    SPELL: 'spell'
})

/**
 * @type {Object[]} Définitions de toutes les cartes du jeu
 */
export const CARD_DEFINITIONS = Object.freeze([
    // Créatures
    {
        id: 'RECRUIT',
        name: 'Recruit',
        type: CardType.CREATURE,
        cost: 1,
        power: 1,
        hp: 2
    },
    {
        id: 'FIGHTER',
        name: 'Fighter',
        type: CardType.CREATURE,
        cost: 2,
        power: 2,
        hp: 3
    },
    {
        id: 'ARCHER',
        name: 'Archer',
        type: CardType.CREATURE,
        cost: 2,
        power: 3,
        hp: 1
    },
    {
        id: 'GUARDIAN',
        name: 'Guardian',
        type: CardType.CREATURE,
        cost: 3,
        power: 1,
        hp: 5
    },
    {
        id: 'CHAMPION',
        name: 'Champion',
        type: CardType.CREATURE,
        cost: 5,
        power: 4,
        hp: 5
    },

    // Sorts
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
