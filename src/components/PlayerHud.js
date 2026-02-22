/**
 * <player-hud> — HUD joueur TCG.
 *
 * Affiche nom, cristaux de mana, compteurs deck/graveyard.
 * Émet un CustomEvent "header-click" quand le header est cliqué
 * (pour cibler le joueur avec une attaque/sort).
 *
 * Attributes :
 *   name, mana, max-mana, deck-count, grave-count, active, mirrored
 *
 * Les <card-zone> enfants sont placés dans le wrapper .ph-content.
 */

const MAX_MANA_CAP = 10

const HEADER_HTML = `
<div class="ph-header">
    <div class="ph-portrait">
        <span class="ph-portrait-letter"></span>
    </div>
    <div class="ph-stats">
        <div class="ph-name-row">
            <span class="ph-name"></span>
            <span class="ph-active-badge">Turn</span>
        </div>
        <div class="ph-mana">
            <span class="ph-mana-label">Mana</span>
            <div class="ph-mana-gems"></div>
            <span class="ph-mana-text"></span>
        </div>
    </div>
    <div class="ph-counters">
        <div class="ph-counter">
            <span class="ph-counter-icon">\u2630</span>
            <span class="ph-counter-label">Deck</span>
            <span class="ph-counter-value ph-deck-val"></span>
        </div>
        <div class="ph-counter">
            <span class="ph-counter-icon">\u2620</span>
            <span class="ph-counter-label">Grave</span>
            <span class="ph-counter-value ph-grave-val"></span>
        </div>
    </div>
</div>`

export default class PlayerHud extends HTMLElement {

    static get observedAttributes() {
        return ['name', 'mana', 'max-mana', 'deck-count', 'grave-count', 'active', 'mirrored']
    }

    constructor() {
        super()
        this._els = null
    }

    connectedCallback() {
        if (this._els) return

        // Sauvegarder les enfants existants (card-zones ajoutées avant connection)
        const existingChildren = [...this.childNodes]

        this.innerHTML = HEADER_HTML

        // Wrapper pour les card-zones (nécessaire pour le reverse mirrored)
        const content = document.createElement('div')
        content.className = 'ph-content'
        for (const child of existingChildren) {
            content.appendChild(child)
        }
        this.appendChild(content)

        this._els = {
            header: this.querySelector('.ph-header'),
            name: this.querySelector('.ph-name'),
            portraitLetter: this.querySelector('.ph-portrait-letter'),
            manaGems: this.querySelector('.ph-mana-gems'),
            manaText: this.querySelector('.ph-mana-text'),
            deckVal: this.querySelector('.ph-deck-val'),
            graveVal: this.querySelector('.ph-grave-val'),
        }

        this._els.header.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('header-click', { bubbles: true }))
        })

        this._update()
    }

    attributeChangedCallback() {
        if (!this._els) return
        this._update()
    }

    _update() {
        const name = this.getAttribute('name') || '???'
        const mana = parseInt(this.getAttribute('mana')) || 0
        const maxMana = Math.min(parseInt(this.getAttribute('max-mana')) || 0, MAX_MANA_CAP)
        const deckCount = this.getAttribute('deck-count') || '0'
        const graveCount = this.getAttribute('grave-count') || '0'

        this._els.portraitLetter.textContent = name.charAt(0).toUpperCase()
        this._els.name.textContent = name
        this._renderManaGems(mana, maxMana)
        this._els.manaText.textContent = `${mana}/${maxMana}`
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
            gem.className = i < current ? 'ph-mana-gem filled' : 'ph-mana-gem spent'
            if (i < current) {
                gem.style.setProperty('--gem-delay', `${i * 0.2}s`)
            }
            container.appendChild(gem)
        }
    }

}

customElements.define('player-hud', PlayerHud)
