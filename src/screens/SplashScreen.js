/**
 * SplashScreen — ecran de chargement initial.
 *
 * Affiche le titre du jeu et une barre de progression animee.
 * Apres un delai simule, navigue automatiquement vers l'ecran home.
 */

const LOAD_DURATION_MS = 2000

export default class SplashScreen {
    constructor(router) {
        this._router = router
        this._timer = null
    }

    mount(root) {
        root.innerHTML = `
            <div class="splash-screen">
                <div class="splash-content">
                    <h1 class="splash-title">TGC</h1>
                    <p class="splash-subtitle">Tactical Card Game</p>
                    <div class="splash-loader">
                        <div class="splash-loader-bar"></div>
                    </div>
                </div>
            </div>
        `

        this._timer = setTimeout(() => {
            this._router.navigate('home')
        }, LOAD_DURATION_MS)
    }

    unmount() {
        if (this._timer) {
            clearTimeout(this._timer)
            this._timer = null
        }
    }
}
