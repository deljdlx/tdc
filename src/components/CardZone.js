/**
 * <card-zone> — zone de cartes TCG (board, hand).
 *
 * Attributes :
 *   type  - "board" | "hand"
 *   label - label custom (défaut déduit du type)
 *
 * Les <tcg-card> sont passés en slot.
 * Un message s'affiche automatiquement quand la zone est vide.
 */

const ZONE_DEFAULTS = {
    board: { label: 'Board', empty: 'No creatures on board' },
    hand: { label: 'Hand', empty: 'No cards in hand' }
}

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    :host {
        display: block;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .zone {
        display: flex;
        gap: var(--card-gap, 8px);
        padding: var(--zone-padding, 10px);
        min-height: calc(var(--card-width, 100px) * 1.2);
        flex-wrap: wrap;
        align-items: flex-start;
        position: relative;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    /* ---- TYPE : board ---- */

    :host([type="board"]) .zone {
        padding-top: 22px;
        justify-content: center;
    }

    /* ---- TYPE : hand ---- */

    :host([type="hand"]) .zone {
        padding-top: 22px;
        background: rgba(255, 255, 255, 0.015);
        border-radius: 0 0 6px 6px;
        justify-content: center;
    }

    /* ---- LABEL ---- */

    .label {
        position: absolute;
        top: 5px;
        left: 10px;
        font-size: 9px;
        color: #4a5c7a;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-weight: 600;
    }

    /* ---- EMPTY ---- */

    .empty {
        width: 100%;
        text-align: center;
        padding: 16px;
        color: #3a4a6a;
        font-size: 11px;
        font-style: italic;
    }

    /* ---- DROP TARGET ---- */

    :host([drop-hint]) .zone {
        outline: 2px dashed rgba(74, 222, 128, 0.3);
        outline-offset: -2px;
    }

    :host([drop-active]) .zone {
        outline: 2px solid #4ade80;
        outline-offset: -2px;
        background: rgba(74, 222, 128, 0.06);
    }
</style>

<div class="zone">
    <span class="label"></span>
    <slot></slot>
    <div class="empty"></div>
</div>
`

export default class CardZone extends HTMLElement {

    static get observedAttributes() {
        return ['type', 'label']
    }

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._els = {
            label: this.shadowRoot.querySelector('.label'),
            empty: this.shadowRoot.querySelector('.empty')
        }

        const slot = this.shadowRoot.querySelector('slot')
        slot.addEventListener('slotchange', () => {
            const hasCards = slot.assignedElements().length > 0
            this._els.empty.style.display = hasCards ? 'none' : ''
        })
    }

    attributeChangedCallback() {
        this._update()
    }

    _update() {
        const type = this.getAttribute('type') || 'board'
        const defaults = ZONE_DEFAULTS[type] || ZONE_DEFAULTS.board
        this._els.label.textContent = this.getAttribute('label') || defaults.label
        this._els.empty.textContent = defaults.empty
    }
}

customElements.define('card-zone', CardZone)
