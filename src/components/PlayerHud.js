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
    /* ---- KEYFRAMES ---- */

    @keyframes border-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }


    @keyframes gem-sparkle {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.4); }
    }


    /* ---- HOST ---- */

    :host {
        display: flex;
        flex-direction: column;
        border: 1px solid #4b5a3a;
        border-radius: 12px;
        overflow: visible;
        background:
            linear-gradient(170deg, rgba(52, 66, 38, 0.95) 0%, rgba(30, 38, 22, 0.98) 100%);
        box-shadow:
            0 10px 24px rgba(12, 16, 10, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
        font-family: 'Source Sans 3', 'Trebuchet MS', sans-serif;
        position: relative;
    }

    :host::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        pointer-events: none;
    }

    :host([mirrored]) {
        flex-direction: column-reverse;
    }

    :host([active]) {
        border-color: #f0c86b;
        box-shadow:
            0 0 18px rgba(240, 200, 107, 0.26),
            0 10px 26px rgba(12, 16, 10, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
    }

    :host([active])::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 12px;
        border: 1px solid rgba(240, 200, 107, 0.34);
        animation: border-pulse 2.5s ease-in-out infinite;
        pointer-events: none;
    }

    :host([drop-hint]) {
        border-style: dashed;
        border-color: #d59a44;
    }

    :host([drop-target]) {
        border-color: #d05f3e;
        box-shadow: 0 0 16px rgba(208, 95, 62, 0.35);
    }

    /* ---- HEADER ---- */

    .header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        background:
            linear-gradient(180deg,
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.01) 45%,
                transparent 100%);
        transition: background 0.2s, box-shadow 0.2s;
        position: relative;
    }

    .header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 8px;
        right: 8px;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(140, 185, 98, 0.35),
            transparent
        );
    }

    .header:hover {
        box-shadow: inset 0 0 12px rgba(240, 200, 107, 0.18);
    }

    /* ---- PORTRAIT ---- */

    .portrait {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background:
            linear-gradient(145deg, #3c4c2b, #25311b);
        border: 2px solid #4f6240;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        position: relative;
    }

    :host([active]) .portrait {
        border-color: #e3b75d;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            0 0 6px rgba(227, 183, 93, 0.3);
    }

    .portrait-letter {
        font-family: 'Cinzel', 'Georgia', serif;
        font-size: 18px;
        font-weight: 700;
        color: #94a977;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        line-height: 1;
    }

    :host([active]) .portrait-letter {
        color: #f4d585;
        text-shadow: 0 0 8px rgba(244, 213, 133, 0.4);
    }

    /* ---- STATS COLUMN ---- */

    .stats {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    /* ---- NAME ---- */

    .name-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .name {
        font-family: 'Cinzel', 'Georgia', serif;
        font-weight: 600;
        font-size: 13px;
        color: #c5d2a9;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: color 0.3s, text-shadow 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :host([active]) .name {
        color: #f4d585;
        text-shadow: 0 0 8px rgba(244, 213, 133, 0.3);
    }

    .active-badge {
        display: none;
        font-size: 7px;
        color: #e3b75d;
        letter-spacing: 1px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 1px 5px;
        border: 1px solid rgba(227, 183, 93, 0.35);
        border-radius: 2px;
        background: rgba(227, 183, 93, 0.12);
        white-space: nowrap;
    }

    :host([active]) .active-badge {
        display: inline-block;
    }

    /* ---- HP ---- */

    .hp {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .hp-bar {
        flex: 1;
    }

    /* ---- MANA ---- */

    .mana {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .mana-label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #93aa7e;
    }

    .mana-gems {
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .mana-text {
        font-size: 11px;
        font-weight: 700;
        color: #6fd1b5;
        font-variant-numeric: tabular-nums;
        min-width: 28px;
        text-align: right;
    }

    .mana-gem {
        width: 10px;
        height: 10px;
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        transition: background 0.3s, box-shadow 0.3s, filter 0.3s;
    }

    .mana-gem.filled {
        background:
            linear-gradient(145deg, #b9e87a, #6ec35a, #3f9a3c);
        filter: drop-shadow(0 0 4px rgba(138, 216, 112, 0.65));
        animation: gem-sparkle 3s ease-in-out infinite;
        animation-delay: var(--gem-delay, 0s);
    }

    .mana-gem.spent {
        background:
            linear-gradient(145deg, #22301b, #182114);
        filter: drop-shadow(0 0 1px rgba(42, 58, 34, 0.3));
    }

    /* ---- COUNTERS ---- */

    .counters {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: auto;
        font-size: 12px;
        color: #7b8f66;
        flex-shrink: 0;
    }

    .counter {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 2px;
        background: rgba(30, 40, 22, 0.65);
        border: 1px solid rgba(82, 108, 66, 0.45);
    }

    .counter-icon {
        font-size: 9px;
        line-height: 1;
        opacity: 0.7;
    }

    .counter-label {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #94a77b;
    }

    .counter-value {
        font-size: 12px;
        font-weight: 700;
        color: #d6e2be;
        font-variant-numeric: tabular-nums;
        min-width: 12px;
        text-align: right;
    }

    /* ---- CONTENT SLOT ---- */

    .content {
        display: flex;
        flex-direction: column;
        padding: 4px;
    }

    :host([mirrored]) .content {
        flex-direction: column-reverse;
    }
</style>

<div class="header">
    <div class="portrait">
        <span class="portrait-letter"></span>
    </div>
    <div class="stats">
        <div class="name-row">
            <span class="name"></span>
            <span class="active-badge">Turn</span>
        </div>
        <div class="hp">
            <player-life-bar class="hp-bar" label="HP" size="sm" variant="arcade"></player-life-bar>
        </div>
        <div class="mana">
            <span class="mana-label">Mana</span>
            <div class="mana-gems"></div>
            <span class="mana-text"></span>
        </div>
    </div>
    <div class="counters">
        <div class="counter">
            <span class="counter-icon">\u2630</span>
            <span class="counter-label">Deck</span>
            <span class="counter-value deck-val"></span>
        </div>
        <div class="counter">
            <span class="counter-icon">\u2620</span>
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
            portraitLetter: this.shadowRoot.querySelector('.portrait-letter'),
            lifeBar: this.shadowRoot.querySelector('player-life-bar'),
            manaGems: this.shadowRoot.querySelector('.mana-gems'),
            manaText: this.shadowRoot.querySelector('.mana-text'),
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

        // Portrait
        this._els.portraitLetter.textContent = name.charAt(0).toUpperCase()

        // Name
        this._els.name.textContent = name

        // HP bar
        this._els.lifeBar.setAttribute('value', `${hp}`)
        this._els.lifeBar.setAttribute('max', `${maxHp}`)

        // Mana gems
        this._renderManaGems(mana, maxMana)
        this._els.manaText.textContent = `${mana}/${maxMana}`

        // Counters
        this._els.deckVal.textContent = deckCount
        this._els.graveVal.textContent = graveCount
    }

    /**
     * Génère les cristaux de mana (remplis + dépensés).
     */
    _renderManaGems(current, max) {
        const container = this._els.manaGems
        container.innerHTML = ''

        for (let i = 0; i < max; i++) {
            const gem = document.createElement('span')
            gem.className = i < current ? 'mana-gem filled' : 'mana-gem spent'
            if (i < current) {
                gem.style.setProperty('--gem-delay', `${i * 0.2}s`)
            }
            container.appendChild(gem)
        }
    }

}

customElements.define('player-hud', PlayerHud)
