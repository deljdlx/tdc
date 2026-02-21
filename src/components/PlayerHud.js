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
    /* ---- HOST ---- */

    :host {
        display: flex;
        flex-direction: column;
        border: 1px solid #D5D2CC;
        border-radius: 12px;
        overflow: visible;
        background: #FFFFFF;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
        transition: border-color 0.3s, box-shadow 0.3s;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        position: relative;
    }

    :host([mirrored]) {
        flex-direction: column-reverse;
    }

    :host([active]) {
        border-color: #5B8C5A;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    :host([drop-hint]) {
        border-style: dashed;
        border-color: #E8927C;
    }

    :host([drop-target]) {
        border-color: #E94560;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    /* ---- HEADER ---- */

    .header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        background: transparent;
        transition: background 0.2s;
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
            rgba(213, 210, 204, 0.5),
            transparent
        );
    }

    .header:hover {
        background: #FAFAF7;
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
        background: #EDEBE6;
        border: 2px solid #D5D2CC;
        position: relative;
    }

    :host([active]) .portrait {
        border-color: #5B8C5A;
    }

    .portrait-letter {
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #5B8C5A;
        line-height: 1;
    }

    :host([active]) .portrait-letter {
        color: #5B8C5A;
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
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-weight: 600;
        font-size: 13px;
        color: #2D3436;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :host([active]) .name {
        color: #5B8C5A;
    }

    .active-badge {
        display: none;
        font-size: 7px;
        color: #5B8C5A;
        letter-spacing: 1px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 1px 5px;
        border: 1px solid rgba(91, 140, 90, 0.4);
        border-radius: 2px;
        background: rgba(91, 140, 90, 0.1);
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
        --life-bar-bg: #EDEBE6;
        --life-bar-frame: #D5D2CC;
        --life-bar-label: #7F8C8D;
        --life-bar-text: #2D3436;
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
        color: #7F8C8D;
    }

    .mana-gems {
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .mana-text {
        font-size: 11px;
        font-weight: 700;
        color: #5B8C5A;
        font-variant-numeric: tabular-nums;
        min-width: 28px;
        text-align: right;
    }

    .mana-gem {
        width: 10px;
        height: 10px;
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        transition: background 0.3s;
    }

    .mana-gem.filled {
        background: linear-gradient(145deg, #7BAF7A, #5B8C5A);
    }

    .mana-gem.spent {
        background: #D5D2CC;
    }

    /* ---- COUNTERS ---- */

    .counters {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: auto;
        font-size: 12px;
        color: #7F8C8D;
        flex-shrink: 0;
    }

    .counter {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 2px;
        background: #FAFAF7;
        border: 1px solid #E8E6E1;
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
        color: #7F8C8D;
    }

    .counter-value {
        font-size: 12px;
        font-weight: 700;
        color: #2D3436;
        font-variant-numeric: tabular-nums;
        min-width: 12px;
        text-align: right;
    }

    /* ---- HEROES ---- */

    .heroes {
        display: flex;
        gap: 6px;
        padding: 6px 10px;
        overflow-x: auto;
    }

    .hero-card {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 6px 8px;
        border-radius: 6px;
        background: #FAFAF7;
        border: 1px solid #E8E6E1;
    }

    .hero-name {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #2D3436;
    }

    .hero-row {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .hero-label {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #7F8C8D;
        min-width: 18px;
    }

    .hero-bar {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: #EDEBE6;
        overflow: hidden;
    }

    .hero-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
    }

    .hero-bar-fill.ap {
        background: #7BA7CC;
    }

    .hero-bar-fill.mana {
        background: linear-gradient(90deg, #7BAF7A, #5B8C5A);
    }

    .hero-value {
        font-size: 9px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: #2D3436;
        min-width: 24px;
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
<div class="heroes"></div>
<div class="content">
    <slot></slot>
</div>
`

export default class PlayerHud extends HTMLElement {

    static get observedAttributes() {
        return ['name', 'hp', 'max-hp', 'mana', 'max-mana', 'deck-count', 'grave-count', 'active', 'mirrored', 'heroes']
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
            graveVal: this.shadowRoot.querySelector('.grave-val'),
            heroes: this.shadowRoot.querySelector('.heroes')
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

        // Heroes
        this._renderHeroes()
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

    /** Rend les cartes hero avec barres AP et mana. */
    _renderHeroes() {
        const container = this._els.heroes
        container.innerHTML = ''

        const raw = this.getAttribute('heroes')
        if (!raw) return

        let heroes
        try { heroes = JSON.parse(raw) } catch { return }
        if (!heroes.length) return

        for (const hero of heroes) {
            const a = hero.attributes
            const card = document.createElement('div')
            card.className = 'hero-card'
            card.innerHTML = this._heroCardHTML(hero.heroDefId, a)
            container.appendChild(card)
        }
    }

    /** @returns {string} HTML interne d'une carte hero. */
    _heroCardHTML(defId, a) {
        const apPct = a.maxAp ? Math.round((a.ap / a.maxAp) * 100) : 0
        const manaPct = a.maxMana ? Math.round((a.mana / a.maxMana) * 100) : 0

        return `
            <span class="hero-name">${defId}</span>
            <div class="hero-row">
                <span class="hero-label">AP</span>
                <div class="hero-bar">
                    <div class="hero-bar-fill ap" style="width:${apPct}%"></div>
                </div>
                <span class="hero-value">${a.ap}/${a.maxAp}</span>
            </div>
            <div class="hero-row">
                <span class="hero-label">MP</span>
                <div class="hero-bar">
                    <div class="hero-bar-fill mana" style="width:${manaPct}%"></div>
                </div>
                <span class="hero-value">${a.mana}/${a.maxMana}</span>
            </div>
        `
    }

}

customElements.define('player-hud', PlayerHud)
