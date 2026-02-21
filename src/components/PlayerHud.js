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
        border: 1px solid #8eb48e;
        border-radius: 12px;
        overflow: visible;
        background:
            linear-gradient(170deg, rgba(235, 247, 225, 0.96) 0%, rgba(205, 229, 193, 0.98) 100%);
        box-shadow:
            0 10px 24px rgba(37, 62, 39, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
        border-color: #efba73;
        box-shadow:
            0 0 18px rgba(239, 186, 115, 0.24),
            0 10px 26px rgba(37, 62, 39, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        transform: translateY(-1px);
    }

    :host([active])::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 12px;
        border: 1px solid rgba(239, 186, 115, 0.34);
        animation: border-pulse 2.5s ease-in-out infinite;
        pointer-events: none;
    }

    :host([drop-hint]) {
        border-style: dashed;
        border-color: #d9a86a;
    }

    :host([drop-target]) {
        border-color: #cb7f66;
        box-shadow: 0 0 16px rgba(203, 127, 102, 0.34);
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
                rgba(255, 255, 255, 0.26) 0%,
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
            rgba(109, 178, 114, 0.42),
            transparent
        );
    }

    .header:hover {
        box-shadow: inset 0 0 12px rgba(239, 186, 115, 0.16);
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
            linear-gradient(145deg, #d8edca, #b6d8aa);
        border: 2px solid #86aa82;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        position: relative;
    }

    :host([active]) .portrait {
        border-color: #efba73;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            0 0 6px rgba(239, 186, 115, 0.3);
    }

    .portrait-letter {
        font-family: 'Cinzel', 'Georgia', serif;
        font-size: 18px;
        font-weight: 700;
        color: #567b51;
        text-shadow: 0 1px 2px rgba(43, 63, 43, 0.28);
        line-height: 1;
    }

    :host([active]) .portrait-letter {
        color: #efba73;
        text-shadow: 0 0 8px rgba(239, 186, 115, 0.35);
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
        color: #45674b;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: color 0.3s, text-shadow 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :host([active]) .name {
        color: #ba7d4f;
        text-shadow: 0 0 8px rgba(239, 186, 115, 0.22);
    }

    .active-badge {
        display: none;
        font-size: 7px;
        color: #ba7d4f;
        letter-spacing: 1px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 1px 5px;
        border: 1px solid rgba(239, 186, 115, 0.4);
        border-radius: 2px;
        background: rgba(239, 186, 115, 0.16);
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
        --life-bar-bg: #eef7e8;
        --life-bar-frame: #8cae86;
        --life-bar-label: #5f7f5d;
        --life-bar-text: #2c4632;
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
        color: #5c7a5f;
    }

    .mana-gems {
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .mana-text {
        font-size: 11px;
        font-weight: 700;
        color: #3f9f7e;
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
            linear-gradient(145deg, #d7f09e, #85cf75, #57a35e);
        filter: drop-shadow(0 0 4px rgba(133, 207, 117, 0.62));
        animation: gem-sparkle 3s ease-in-out infinite;
        animation-delay: var(--gem-delay, 0s);
    }

    .mana-gem.spent {
        background:
            linear-gradient(145deg, #9bb096, #7f937a);
        filter: drop-shadow(0 0 1px rgba(61, 89, 63, 0.26));
    }

    /* ---- COUNTERS ---- */

    .counters {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: auto;
        font-size: 12px;
        color: #587153;
        flex-shrink: 0;
    }

    .counter {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 2px;
        background: rgba(219, 236, 208, 0.8);
        border: 1px solid rgba(128, 166, 126, 0.5);
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
        color: #5f7d5e;
    }

    .counter-value {
        font-size: 12px;
        font-weight: 700;
        color: #395c3f;
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
