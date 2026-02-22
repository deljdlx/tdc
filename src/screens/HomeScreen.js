/**
 * HomeScreen — menu principal.
 *
 * Affiche le titre du jeu et les boutons de navigation.
 */

import { primaryBtn, secondaryBtn } from '../ui/kit.js'

export default class HomeScreen {
    constructor(router) {
        this._router = router
    }

    mount(root) {
        root.innerHTML = `
            <div class="home-screen">
                <div class="home-card">
                    <h1 class="home-title">TGC</h1>
                    <p class="home-subtitle">Tactical Card Game</p>
                    <div class="home-buttons">
                        ${primaryBtn('Play', 'js-play')}
                        ${secondaryBtn('Heroes', 'js-heroes')}
                        ${secondaryBtn('Deck', 'js-deck')}
                    </div>
                </div>
            </div>
        `

        root.querySelector('.js-play')
            .addEventListener('click', () => this._router.navigate('game'))
        root.querySelector('.js-heroes')
            .addEventListener('click', () => this._router.navigate('heroes'))
        root.querySelector('.js-deck')
            .addEventListener('click', () => this._router.navigate('deck'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }
}
