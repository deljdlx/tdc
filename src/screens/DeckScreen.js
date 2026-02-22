/**
 * DeckScreen — collection de cartes.
 *
 * Affiche toutes les cartes disponibles dans le jeu.
 * Ecran de consultation pour le moment, la composition
 * de deck viendra ensuite.
 */

import { CARD_DEFINITIONS } from '../gameplay/definitions/cards.js'
import { screenLayout, grid, card } from '../ui/kit.js'
import { EFFECT_LABELS } from '../gameplay/definitions/effectLabels.js'

const PICSUM = 'https://picsum.photos/seed'

export default class DeckScreen {
    constructor(router) {
        this._router = router
    }

    mount(root) {
        const cards = CARD_DEFINITIONS
            .map(c => this._cardTile(c))
            .join('')

        const count = `<div class="screen-count">${CARD_DEFINITIONS.length} spells</div>`

        root.innerHTML = screenLayout(
            'Collection',
            count + grid(cards, { minWidth: '180px' }),
            { subtitle: 'Browse your spell library' }
        )

        root.querySelector('.js-back')
            .addEventListener('click', () => this._router.navigate('home'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }

    _cardTile(def) {
        const effectFn = EFFECT_LABELS[def.effect]
        const effectText = effectFn
            ? effectFn(def.effectPayload?.amount)
            : def.effect

        return card(`
            <div class="deck-card-art"
                 style="background-image:url(${PICSUM}/${def.id}/160/100)">
                <span class="deck-card-cost">${def.cost}</span>
            </div>
            <div class="deck-card-body">
                <div class="deck-card-name">${def.name}</div>
                <div class="deck-card-type">${def.type}</div>
                <div class="deck-card-effect">${effectText}</div>
            </div>
        `)
    }
}
