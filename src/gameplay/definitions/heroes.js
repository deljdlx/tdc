/**
 * Definitions des heros du jeu.
 *
 * Chaque hero a des stats de base qui determinent sa jauge d'AP
 * (action points), sa vitesse de recharge et ses points de vie.
 * Les AP et le mana sont des ressources independantes par hero.
 */

export const HERO_DEFINITIONS = Object.freeze([
    { id: 'WARRIOR', name: 'Warrior', speed: 3, maxAp: 5, hp: 30, maxMana: 10 },
    { id: 'MAGE', name: 'Mage', speed: 2, maxAp: 8, hp: 15, maxMana: 10 },
    { id: 'RANGER', name: 'Ranger', speed: 4, maxAp: 4, hp: 20, maxMana: 10 },
    { id: 'PRIEST', name: 'Priest', speed: 3, maxAp: 6, hp: 18, maxMana: 10 }
])

/**
 * Retrouve une definition de hero par son id.
 *
 * @param {string} definitionId
 * @returns {Object|undefined}
 */
export function getHeroDefinition(definitionId) {
    return HERO_DEFINITIONS.find(d => d.id === definitionId)
}
