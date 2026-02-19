/**
 * <player-hud> — HUD joueur TCG.
 *
 * Affiche nom, barre de HP, cristaux de mana, compteurs deck/graveyard.
 * Émet un CustomEvent "header-click" quand le header est cliqué
 * (pour cibler le joueur avec une attaque/sort).
 *
 * Attributes :
 *   name, hp, max-hp, mana, max-mana, deck-count, grave-count, active
 *
 * Slot par défaut pour les <card-zone> enfants.
 */

const MAX_MANA_CAP = 10

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    :host {
        display: flex;
        flex-direction: column;
        border: 1px solid #1e2e4a;
        border-radius: 8px;
        overflow: visible;
        background: #0d1321;
        transition: border-color 0.3s, box-shadow 0.3s;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }

    :host([mirrored]) {
        flex-direction: column-reverse;
    }

    :host([active]) {
        border-color: #f0c040;
        box-shadow: 0 0 10px rgba(240, 192, 64, 0.12);
    }

    :host([drop-hint]) {
        border-style: dashed;
        border-color: #f59e0b;
    }

    :host([drop-target]) {
        border-color: #e94560;
        box-shadow: 0 0 16px rgba(233, 69, 96, 0.35);
    }

    /* ---- HEADER ---- */

    .header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 8px 12px;
        cursor: pointer;
        background: linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%);
        transition: background 0.15s;
    }

    .header:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    /* ---- NAME ---- */

    .name {
        font-weight: 700;
        font-size: 13px;
        color: #6b7fa0;
        min-width: 50px;
        transition: color 0.3s;
    }

    :host([active]) .name {
        color: #f0c040;
        text-shadow: 0 0 8px rgba(240, 192, 64, 0.3);
    }

    /* ---- HP ---- */

    .hp {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .hp-icon {
        color: #ef4444;
        font-size: 13px;
        line-height: 1;
    }

    .hp-bar {
        width: 80px;
        height: 7px;
        background: #111827;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.04);
    }

    .hp-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.4s ease, background 0.4s ease;
        box-shadow: 0 0 6px var(--hp-glow, rgba(34,197,94,0.3));
    }

    .hp-text {
        font-size: 12px;
        font-weight: 700;
        color: #ef4444;
        min-width: 20px;
    }

    /* ---- MANA ---- */

    .mana {
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .mana-label {
        color: #60a5fa;
        font-size: 11px;
        font-weight: 700;
        margin-right: 2px;
    }

    .mana-gem {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        transition: background 0.25s, box-shadow 0.25s;
    }

    .mana-gem.filled {
        background: linear-gradient(135deg, #60a5fa, #2563eb);
        box-shadow: 0 0 5px rgba(96, 165, 250, 0.4);
    }

    .mana-gem.spent {
        background: #141c30;
        border: 1px solid #1e2e4a;
    }

    /* ---- COUNTERS ---- */

    .counters {
        display: flex;
        gap: 10px;
        margin-left: auto;
        font-size: 11px;
        color: #4a5c7a;
    }

    .counter {
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .counter-label {
        font-weight: 400;
    }

    .counter-value {
        font-weight: 700;
        color: #6b7fa0;
    }

    /* ---- CONTENT SLOT ---- */

    .content {
        display: flex;
        flex-direction: column;
    }

    :host([mirrored]) .content {
        flex-direction: column-reverse;
    }
</style>

<div class="header">
    <span class="name"></span>
    <div class="hp">
        <span class="hp-icon">\u2665</span>
        <div class="hp-bar">
            <div class="hp-fill"></div>
        </div>
        <span class="hp-text"></span>
    </div>
    <div class="mana">
        <span class="mana-label">\u25C6</span>
    </div>
    <div class="counters">
        <div class="counter">
            <span class="counter-label">Deck</span>
            <span class="counter-value deck-val"></span>
        </div>
        <div class="counter">
            <span class="counter-label">Grave</span>
            <span class="counter-value grave-val"></span>
        </div>
    </div>
</div>
<div class="content">
    <slot></slot>
</div>
`

export default class PlayerHud extends HTMLElement {

    static get observedAttributes() {
        return ['name', 'hp', 'max-hp', 'mana', 'max-mana', 'deck-count', 'grave-count', 'active', 'mirrored']
    }

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._els = {
            header: this.shadowRoot.querySelector('.header'),
            name: this.shadowRoot.querySelector('.name'),
            hpFill: this.shadowRoot.querySelector('.hp-fill'),
            hpText: this.shadowRoot.querySelector('.hp-text'),
            mana: this.shadowRoot.querySelector('.mana'),
            deckVal: this.shadowRoot.querySelector('.deck-val'),
            graveVal: this.shadowRoot.querySelector('.grave-val')
        }

        this._els.header.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('header-click', { bubbles: true }))
        })
    }

    attributeChangedCallback() {
        this._update()
    }

    _update() {
        const name = this.getAttribute('name') || '???'
        const hp = parseInt(this.getAttribute('hp')) || 0
        const maxHp = parseInt(this.getAttribute('max-hp')) || 20
        const mana = parseInt(this.getAttribute('mana')) || 0
        const maxMana = Math.min(parseInt(this.getAttribute('max-mana')) || 0, MAX_MANA_CAP)
        const deckCount = this.getAttribute('deck-count') || '0'
        const graveCount = this.getAttribute('grave-count') || '0'

        // Name
        this._els.name.textContent = name

        // HP bar
        const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
        this._els.hpFill.style.width = `${hpPct}%`
        this._els.hpFill.style.background = this._hpColor(hpPct)
        this._els.hpFill.style.setProperty('--hp-glow', this._hpGlow(hpPct))
        this._els.hpText.textContent = hp

        // Mana gems
        this._renderManaGems(mana, maxMana)

        // Counters
        this._els.deckVal.textContent = deckCount
        this._els.graveVal.textContent = graveCount
    }

    /**
     * Génère les cristaux de mana (remplis + dépensés).
     */
    _renderManaGems(current, max) {
        const container = this._els.mana
        // Garder le label, supprimer les gems existants
        const label = container.querySelector('.mana-label')
        container.innerHTML = ''
        container.appendChild(label)

        for (let i = 0; i < max; i++) {
            const gem = document.createElement('span')
            gem.className = i < current ? 'mana-gem filled' : 'mana-gem spent'
            container.appendChild(gem)
        }
    }

    /**
     * Couleur de la barre HP selon le pourcentage.
     */
    _hpColor(pct) {
        if (pct > 60) return 'linear-gradient(90deg, #22c55e, #16a34a)'
        if (pct > 30) return 'linear-gradient(90deg, #f59e0b, #d97706)'
        return 'linear-gradient(90deg, #ef4444, #dc2626)'
    }

    _hpGlow(pct) {
        if (pct > 60) return 'rgba(34, 197, 94, 0.3)'
        if (pct > 30) return 'rgba(245, 158, 11, 0.3)'
        return 'rgba(239, 68, 68, 0.4)'
    }
}

customElements.define('player-hud', PlayerHud)
