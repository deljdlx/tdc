/**
 * GameScreen — ecran de jeu.
 *
 * Encapsule UiAdapter en singleton : la premiere montee cree
 * l'instance, les suivantes relancent une nouvelle partie.
 */

import UiAdapter from '../gameplay/ui/UiAdapter.js'

export default class GameScreen {
    constructor() {
        this._ui = null
    }

    mount(root) {
        if (!this._ui) {
            this._ui = new UiAdapter(root)
        }
        this._ui.start()
    }

    unmount() {
        // UiAdapter n'a pas de methode de demontage —
        // ses modals et FxCanvas sont sur document.body et persistent.
    }
}
