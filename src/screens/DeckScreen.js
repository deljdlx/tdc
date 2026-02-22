/**
 * DeckScreen — collection de cartes.
 *
 * Affiche toutes les cartes disponibles dans le jeu.
 * Ecran de consultation pour le moment, la composition
 * de deck viendra ensuite.
 */

import { CARD_DEFINITIONS } from '../gameplay/definitions/cards.js'

const PICSUM = 'https://picsum.photos/seed'

const EFFECT_LABELS = {
    DEAL_DAMAGE: (p) => `Deal ${p.amount} damage`,
    RESTORE_HP: (p) => `Restore ${p.amount} HP`
}

export default class DeckScreen {
    constructor(router) {
        this._router = router
    }

    mount(root) {
        const cards = CARD_DEFINITIONS
            .map(c => this._cardTile(c))
            .join('')

        root.innerHTML = `
            <div class="deck-screen">
                <div class="deck-header">
                    <button class="deck-back-btn">Back</button>
                    <h1 class="deck-title">Collection</h1>
                </div>
                <div class="deck-grid">${cards}</div>
            </div>
        `

        root.querySelector('.deck-back-btn')
            .addEventListener('click', () => this._router.navigate('home'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }

    _cardTile(card) {
        const effectFn = EFFECT_LABELS[card.effect]
        const effectText = effectFn
            ? effectFn(card.effectPayload)
            : card.effect

        return `
            <div class="deck-card">
                <div class="deck-card-art"
                     style="background-image:url(${PICSUM}/${card.id}/160/100)">
                    <span class="deck-card-cost">${card.cost}</span>
                </div>
                <div class="deck-card-body">
                    <div class="deck-card-name">${card.name}</div>
                    <div class="deck-card-type">${card.type}</div>
                    <div class="deck-card-effect">${effectText}</div>
                </div>
            </div>
        `
    }
}
