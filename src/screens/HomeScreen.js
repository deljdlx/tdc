/**
 * HomeScreen — menu principal.
 *
 * Affiche le titre du jeu et les boutons de navigation.
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
                    <div class="home-buttons">
                        <button class="home-play-btn">Play</button>
                        <button class="home-heroes-btn">Heroes</button>
                    </div>
                </div>
            </div>
        `

        root.querySelector('.home-play-btn')
            .addEventListener('click', () => this._router.navigate('game'))
        root.querySelector('.home-heroes-btn')
            .addEventListener('click', () => this._router.navigate('heroes'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }
}
