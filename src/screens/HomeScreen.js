/**
 * HomeScreen — menu principal.
 *
 * Affiche le titre du jeu et un bouton pour lancer une partie.
 */

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
                    <button class="home-play-btn">Play</button>
                </div>
            </div>
        `

        root.querySelector('.home-play-btn')
            .addEventListener('click', () => this._router.navigate('game'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }
}
