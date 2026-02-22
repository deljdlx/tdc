/**
 * <card-zone> — zone de cartes TCG (board, hand).
 *
 * Attributes :
 *   type  - "board" | "hand"
 *   label - label custom (défaut déduit du type)
 *
 * Les <tcg-card> sont ajoutés comme enfants directs.
 * Un message s'affiche automatiquement quand la zone est vide.
 */

const ZONE_DEFAULTS = {
    board: { label: 'Board', empty: 'No creatures on board' },
    hand: { label: 'Hand', empty: 'No cards in hand' }
}

export default class CardZone extends HTMLElement {

    static get observedAttributes() {
        return ['type', 'label']
    }

    constructor() {
        super()
        this._els = null
    }

    connectedCallback() {
        if (this._els) return

        const label = document.createElement('span')
        label.className = 'cz-label'
        this.prepend(label)

        const empty = document.createElement('div')
        empty.className = 'cz-empty'
        this.appendChild(empty)

        this._els = { label, empty }
        this._syncEmpty()
        this._update()
    }

    attributeChangedCallback() {
        if (!this._els) return
        this._update()
    }

    _update() {
        const type = this.getAttribute('type') || 'board'
        const defaults = ZONE_DEFAULTS[type] || ZONE_DEFAULTS.board
        this._els.label.textContent = this.getAttribute('label') || defaults.label
        this._els.empty.textContent = defaults.empty
    }

    _syncEmpty() {
        const hasCards = Array.from(this.children).some(
            c => c !== this._els.label && c !== this._els.empty
        )
        this._els.empty.style.display = hasCards ? 'none' : ''
    }
}

customElements.define('card-zone', CardZone)
