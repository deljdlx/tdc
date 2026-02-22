/**
 * Router — navigation entre ecrans avec synchronisation hash.
 *
 * L'URL reflete l'ecran courant : #home, #heroes, #deck?key=val.
 * Le navigateur back/forward fonctionne via hashchange.
 * Chaque ecran implemente mount(root, params) / unmount().
 */

export default class Router {
    constructor(root) {
        this._root = root
        this._screens = new Map()
        this._current = null
        this._currentName = null

        window.addEventListener('hashchange', () => this._onHashChange())
    }

    /**
     * Enregistre un ecran sous un nom unique.
     *
     * @param {string} name
     * @param {{ mount(root: HTMLElement, params: Object): void, unmount(): void }} screen
     */
    register(name, screen) {
        this._screens.set(name, screen)
    }

    /**
     * Demarre le routeur. Lit le hash courant ou navigue
     * vers le fallback si le hash n'est pas reconnu.
     *
     * @param {string} fallback
     */
    start(fallback) {
        const { name } = this._parseHash()
        if (name && this._screens.has(name)) {
            this.navigate(name)
        } else {
            this.navigate(fallback)
        }
    }

    /**
     * Navigue vers l'ecran designe avec des parametres optionnels.
     *
     * @param {string} name
     * @param {Object} [params={}]
     */
    navigate(name, params = {}) {
        const screen = this._screens.get(name)
        if (!screen) throw new Error(`Unknown screen: ${name}`)

        if (this._current) {
            this._current.unmount()
        }

        this._currentName = name
        this._updateHash(name, params)

        this._root.innerHTML = ''
        screen.mount(this._root, params)
        this._current = screen
    }

    /** @private */
    _onHashChange() {
        const { name, params } = this._parseHash()
        if (!name || !this._screens.has(name)) return
        if (name === this._currentName) return

        this.navigate(name, params)
    }

    /** @private */
    _parseHash() {
        const raw = window.location.hash.slice(1)
        if (!raw) return { name: null, params: {} }

        const qIndex = raw.indexOf('?')
        if (qIndex === -1) return { name: raw, params: {} }

        const name = raw.slice(0, qIndex)
        const params = Object.fromEntries(new URLSearchParams(raw.slice(qIndex + 1)))
        return { name, params }
    }

    /** @private */
    _updateHash(name, params) {
        const query = new URLSearchParams(params).toString()
        const hash = query ? `${name}?${query}` : name
        if (window.location.hash.slice(1) !== hash) {
            window.location.hash = hash
        }
    }
}
