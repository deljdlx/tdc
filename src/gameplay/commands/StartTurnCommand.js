/**
 * StartTurnCommand — début d'un nouveau tour.
 *
 * - maxMana += 1 (cap à 10)
 * - mana courant = maxMana
 * - piocher 1 carte
 * - reset hasAttacked des héros du joueur actif
 */

export default class StartTurnCommand {
    static type = 'START_TURN'
    static category = 'game_flow'
    static edges = [
        { target: 'DRAW_CARDS', label: 'DRAW_CARDS' }
    ]

    constructor(payload) {
        this.payload = payload
    }

    validate(state) {
        const { playerId } = this.payload
        if (state.turnState.activePlayerId !== playerId) {
            return { valid: false, reason: `Not ${playerId}'s turn` }
        }
        return { valid: true }
    }

    apply(state, ctx) {
        const { playerId } = this.payload
        const patches = []
        const domainEvents = []
        const intents = []

        const player = state.players[playerId]

        // Incrémenter mana (cap 10)
        const newMaxMana = Math.min((player.attributes.maxMana || 0) + 1, 10)
        patches.push(
            { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'maxMana', value: newMaxMana } },
            { type: 'SET_ATTRIBUTE', target: playerId, payload: { key: 'mana', value: newMaxMana } }
        )

        // Recharger AP, mana et reset hasAttacked des heros du joueur actif
        const heroes = ctx.query.getHeroesForPlayer(playerId)
        for (const hero of heroes) {
            const currentAp = hero.attributes.ap || 0
            const speed = hero.attributes.speed || 0
            const maxAp = hero.attributes.maxAp || 0
            patches.push(
                { type: 'SET_ATTRIBUTE', target: hero.id, payload: { key: 'ap', value: Math.min(currentAp + speed, maxAp) } },
                { type: 'SET_ATTRIBUTE', target: hero.id, payload: { key: 'hasAttacked', value: false } }
            )

            const heroMaxMana = Math.min((hero.attributes.maxMana || 0) + 1, 10)
            patches.push(
                { type: 'SET_ATTRIBUTE', target: hero.id, payload: { key: 'maxMana', value: heroMaxMana } },
                { type: 'SET_ATTRIBUTE', target: hero.id, payload: { key: 'mana', value: heroMaxMana } }
            )
        }

        // Phase main
        patches.push({
            type: 'SET_TURN_STATE', target: 'turnState', payload: { field: 'phase', value: 'main' }
        })

        domainEvents.push({
            type: 'TURN_STARTED',
            payload: { playerId, turnNumber: state.turnState.turnNumber },
            sourceCommandType: 'START_TURN'
        })

        // Piocher 1 carte
        intents.push({
            type: 'DRAW_CARDS',
            payload: { playerId, count: 1 },
            source: 'START_TURN'
        })

        return { patches, domainEvents, intents }
    }
}
