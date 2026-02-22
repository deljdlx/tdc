/**
 * Router — navigation simple entre ecrans.
 *
 * Chaque ecran implemente mount(root) / unmount().
 * Le routeur gere le cycle de vie : demontage de l'ecran courant,
 * nettoyage du root, montage du nouvel ecran.
 */

export default class Router {
    constructor(root) {
        this._root = root
        this._screens = new Map()
        this._current = null
    }

    /**
     * Enregistre un ecran sous un nom unique.
     *
     * @param {string} name
     * @param {{ mount(root: HTMLElement): void, unmount(): void }} screen
     */
    register(name, screen) {
        this._screens.set(name, screen)
    }

    /**
     * Navigue vers l'ecran designe.
     *
     * @param {string} name
     */
    navigate(name) {
        const screen = this._screens.get(name)
        if (!screen) throw new Error(`Unknown screen: ${name}`)

        if (this._current) {
            this._current.unmount()
        }

        this._root.innerHTML = ''
        screen.mount(this._root)
        this._current = screen
    }
}
