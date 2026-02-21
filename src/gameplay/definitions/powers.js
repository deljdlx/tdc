/**
 * Definitions des pouvoirs de heros.
 *
 * Chaque pouvoir coute des AP et a un type de cible (enemy_hero,
 * ally_hero, self, all_enemies). Les effets sont resolus via des
 * intents dans UsePowerCommand.
 */

export const POWER_DEFINITIONS = Object.freeze([
    // ---- WARRIOR ----
    {
        id: 'SHIELD_BASH',
        heroClass: 'WARRIOR',
        name: 'Shield Bash',
        apCost: 2,
        targetType: 'enemy_hero',
        effects: [
            { type: 'DEAL_DAMAGE', attribute: 'power' },
            { type: 'APPLY_BUFF', attribute: 'power', delta: -1, duration: 1 }
        ],
        description: 'Deal power damage and reduce target power by 1 for 1 turn.'
    },
    {
        id: 'WAR_CRY',
        heroClass: 'WARRIOR',
        name: 'War Cry',
        apCost: 3,
        targetType: 'self',
        effects: [
            { type: 'APPLY_BUFF', attribute: 'power', delta: 2, duration: 1 }
        ],
        description: '+2 power for 1 turn.'
    },
    {
        id: 'CHARGE',
        heroClass: 'WARRIOR',
        name: 'Charge',
        apCost: 4,
        targetType: 'enemy_hero',
        effects: [
            { type: 'DEAL_DAMAGE', amount: 'double_power' }
        ],
        description: 'Deal double power damage.'
    },

    // ---- MAGE ----
    {
        id: 'ARCANE_BOLT',
        heroClass: 'MAGE',
        name: 'Arcane Bolt',
        apCost: 2,
        targetType: 'enemy_hero',
        effects: [
            { type: 'DEAL_DAMAGE', amount: 3 }
        ],
        description: 'Deal 3 damage.'
    },
    {
        id: 'FROST_SHIELD',
        heroClass: 'MAGE',
        name: 'Frost Shield',
        apCost: 3,
        targetType: 'self',
        effects: [
            { type: 'APPLY_BUFF', attribute: 'armor', delta: 5, duration: 1 }
        ],
        description: '+5 armor for 1 turn.'
    },
    {
        id: 'METEOR',
        heroClass: 'MAGE',
        name: 'Meteor',
        apCost: 6,
        targetType: 'all_enemies',
        effects: [
            { type: 'DEAL_DAMAGE', amount: 4 }
        ],
        description: 'Deal 4 damage to all enemies.'
    },

    // ---- RANGER ----
    {
        id: 'QUICK_SHOT',
        heroClass: 'RANGER',
        name: 'Quick Shot',
        apCost: 2,
        targetType: 'enemy_hero',
        freeAction: true,
        effects: [
            { type: 'DEAL_DAMAGE', amount: 2 }
        ],
        description: 'Deal 2 damage. Does not end turn action.'
    },
    {
        id: 'POISON_ARROW',
        heroClass: 'RANGER',
        name: 'Poison Arrow',
        apCost: 3,
        targetType: 'enemy_hero',
        effects: [
            { type: 'DEAL_DAMAGE', amount: 1 },
            { type: 'APPLY_BUFF', attribute: 'power', delta: -1, duration: 2 }
        ],
        description: 'Deal 1 damage and reduce target power by 1 for 2 turns.'
    },
    {
        id: 'EVASION',
        heroClass: 'RANGER',
        name: 'Evasion',
        apCost: 2,
        targetType: 'self',
        effects: [
            { type: 'APPLY_BUFF', attribute: 'armor', delta: 3, duration: 1 }
        ],
        description: '+3 armor for 1 turn.'
    },

    // ---- PRIEST ----
    {
        id: 'HOLY_HEAL',
        heroClass: 'PRIEST',
        name: 'Holy Heal',
        apCost: 2,
        targetType: 'ally_hero',
        effects: [
            { type: 'RESTORE_HP', amount: 5 }
        ],
        description: 'Restore 5 HP to an ally hero.'
    },
    {
        id: 'BLESSING',
        heroClass: 'PRIEST',
        name: 'Blessing',
        apCost: 3,
        targetType: 'ally_hero',
        effects: [
            { type: 'APPLY_BUFF', attribute: 'power', delta: 2, duration: 1 }
        ],
        description: '+2 power to an ally for 1 turn.'
    },
    {
        id: 'SMITE',
        heroClass: 'PRIEST',
        name: 'Smite',
        apCost: 4,
        targetType: 'enemy_hero',
        effects: [
            { type: 'DEAL_DAMAGE', amount: 3 }
        ],
        description: 'Deal 3 damage.'
    }
])

/**
 * Retrouve les pouvoirs disponibles pour une classe de hero.
 *
 * @param {string} heroClass
 * @returns {Object[]}
 */
export function getPowersForClass(heroClass) {
    return POWER_DEFINITIONS.filter(p => p.heroClass === heroClass)
}

/**
 * Retrouve un pouvoir par son id.
 *
 * @param {string} powerId
 * @returns {Object|undefined}
 */
export function getPowerDefinition(powerId) {
    return POWER_DEFINITIONS.find(p => p.id === powerId)
}
