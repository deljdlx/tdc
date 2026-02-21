/**
 * DefendCommand — un hero se met en posture defensive.
 *
 * Gagne de l'armure egale a sa puissance pour le tour en cours.
 * Consomme l'action du hero pour ce tour.
 */

export default class DefendCommand {
    static type = 'DEFEND'
    static category = 'player_action'
    static edges = []

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId, heroId } = this.payload

        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: 'Not your turn' }
        }

        const hero = state.heroes[heroId]
        if (!hero) {
            return { valid: false, reason: `Hero "${heroId}" not found` }
        }

        if (hero.playerId !== playerId) {
            return { valid: false, reason: 'Not your hero' }
        }

        if (hero.attributes.hasActed) {
            return { valid: false, reason: 'Already acted this turn' }
        }

        return { valid: true }
    }

    apply(state, ctx) {
        const { heroId } = this.payload
        const heroInState = state.heroes[heroId]
        const power = ctx.query.query(heroId, 'power')

        const patches = [
            { type: 'SET_ATTRIBUTE', target: heroId, payload: { key: 'hasActed', value: true } },
            { type: 'SET_ATTRIBUTE', target: heroId, payload: { key: 'isDefending', value: true } },
            { type: 'SET_ATTRIBUTE', target: heroId, payload: { key: 'armor', value: (heroInState.attributes.armor || 0) + power } }
        ]

        const domainEvents = [{
            type: 'HERO_DEFENDED',
            payload: { heroId, playerId: heroInState.playerId, armorGained: power },
            sourceCommandType: 'DEFEND'
        }]

        return { patches, domainEvents, intents: [] }
    }
}
