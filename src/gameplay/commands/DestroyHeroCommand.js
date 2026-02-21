/**
 * DestroyHeroCommand — retire un héro du jeu.
 *
 * Appelé quand un héro tombe à 0 hp ou moins.
 * Vérifie la condition de victoire après la destruction.
 */

export default class DestroyHeroCommand {
    static type = 'DESTROY_HERO'
    static category = 'terminal'
    static edges = [
        { target: 'CHECK_WIN_CONDITION', label: 'hero destroyed' }
    ]

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { heroId } = this.payload
        if (!state.heroes[heroId]) {
            return { valid: false, reason: `Hero "${heroId}" not found` }
        }
        return { valid: true }
    }

    apply(_state) {
        const { heroId, playerId } = this.payload

        return {
            patches: [{
                type: 'REMOVE_ENTITY',
                target: heroId,
                payload: {}
            }],
            domainEvents: [{
                type: 'HERO_DESTROYED',
                payload: { heroId, playerId },
                sourceCommandType: 'DESTROY_HERO'
            }],
            intents: [{
                type: 'CHECK_WIN_CONDITION',
                payload: { reason: 'heroes_dead', loserId: playerId },
                source: 'DESTROY_HERO'
            }]
        }
    }
}
