/**
 * <tcg-card> — Web Component réutilisable pour l'affichage d'une carte TCG.
 *
 * Attributes observés :
 *   name, cost, type, power, hp, effect, definition-id,
 *   playable, can-attack, selected, summoning-sickness, has-attacked
 *
 * L'illustration utilise Lorem Picsum avec un seed basé sur definition-id
 * pour garantir la même image par type de carte.
 *
 * Theming via CSS custom properties :
 *   --card-width  (défaut 130px)
 */

const PICSUM = 'https://picsum.photos/seed'

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
        display: inline-block;
        width: var(--card-width, 100px);
        height: calc(var(--card-width, 100px) * 1.4);
        user-select: none;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    /* ==================================================
       CARD BORDER (wrapper with solid color)
       ================================================== */

    .card-border {
        position: relative;
        height: 100%;
        border-radius: 16px;
        padding: 3px;
        background: #D5D2CC;
        transition: background 0.25s;
    }

    .card-border.spell {
        background: #B8A9D4;
    }

    .card-border.playable {
        background: #4CAF50;
    }

    .card-border.can-attack {
        background: #E94560;
    }

    .card-border.selected {
        background: #F0A030;
        animation: selectedPulse 2s ease-in-out infinite;
    }

    @keyframes selectedPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }

    .card-border.drop-hint {
        background: #F0A030;
        animation: dropHintPulse 1.5s ease-in-out infinite;
    }

    @keyframes dropHintPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.75; }
    }

    .card-border.drop-target {
        background: #E94560;
    }

    /* ==================================================
       CARD FRAME (inner content)
       ================================================== */

    .frame {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 13px;
        overflow: hidden;
        background: #FFFFFF;
        cursor: default;
        transition: box-shadow 0.25s, transform 0.25s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .frame.spell {
        background: #FAF8FF;
    }

    /* ==================================================
       INTERACTIVE STATES
       ================================================== */

    .frame.playable {
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .frame.playable:hover {
        transform: translateY(-6px) scale(1.04);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .frame.can-attack {
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .frame.can-attack:hover {
        transform: translateY(-6px) scale(1.04);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .frame.selected {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .frame.exhausted {
        opacity: 0.55;
        filter: grayscale(0.3);
    }

    .frame.sick {
        filter: saturate(0.5) brightness(0.88);
        transition: filter 1.2s ease-in;
    }

    /* ==================================================
       DRAG & DROP STATES
       ================================================== */

    :host([draggable="true"]) .frame {
        cursor: grab;
    }

    :host(.dragging) .frame {
        opacity: 0.3;
        filter: grayscale(0.5) brightness(0.6);
        transform: scale(0.95);
    }

    :host([drop-hint]) .card-border {
        background: #F0A030;
        animation: dropHintPulse 1.5s ease-in-out infinite;
    }

    :host([drop-hint]) .frame {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    :host([drop-target]) .card-border {
        background: #E94560;
    }

    :host([drop-target]) .frame {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
        transform: scale(1.04);
    }

    /* ==================================================
       COST GEM
       ================================================== */

    .cost {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: white;
        z-index: 3;
        background: #7BA7CC;
        border: 2px solid #5889B0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .spell .cost {
        background: #9B8EC4;
        border-color: #7A6DA8;
    }

    /* ==================================================
       CARD ART
       ================================================== */

    .art-wrap {
        position: relative;
        margin: 6px 6px 0;
        flex: 1;
        min-height: 0;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #D5D2CC;
    }

    .spell .art-wrap {
        border-color: #C4B8DA;
    }

    .art {
        position: absolute;
        inset: 0;
        background: #EDEBE6 center / cover no-repeat;
        opacity: 0;
        transition: opacity 0.4s ease;
    }

    .art.loaded {
        opacity: 1;
    }

    .art::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.3) 100%);
        pointer-events: none;
    }

    /* ==================================================
       TEXT SECTIONS
       ================================================== */

    .name {
        padding: 4px 6px 3px;
        font-size: 9px;
        font-weight: 700;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: #2D3436;
        text-align: center;
        letter-spacing: 0.4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
        background: #FAFAF7;
        border-top: 1px solid #E8E6E1;
        border-bottom: 1px solid #E8E6E1;
    }

    .spell .name {
        color: #4A3D6B;
    }

    .type-line {
        padding: 2px 6px;
        font-size: 6.5px;
        color: #7F8C8D;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex-shrink: 0;
        background: transparent;
        border-bottom: 1px solid #E8E6E1;
    }

    .body {
        padding: 4px 6px 4px;
        min-height: 0;
        flex-shrink: 0;
        background: #FAFAF7;
    }

    .effect {
        font-size: 7px;
        color: #2D3436;
        text-align: center;
        font-style: italic;
        line-height: 1.3;
        font-weight: 500;
    }

    .effect:empty {
        display: none;
    }

    /* ==================================================
       STATS (POWER/HP)
       ================================================== */

    .stats {
        display: flex;
        justify-content: flex-end;
        padding: 3px 6px 6px;
        gap: 5px;
        flex-shrink: 0;
    }

    .stats:empty {
        display: none;
    }

    .stat {
        width: 24px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: white;
    }

    .power {
        background: #E94560;
    }

    .hp {
        background: #5B8C5A;
    }

    /* ==================================================
       STATUS OVERLAY
       ================================================== */

    .status-overlay {
        position: absolute;
        bottom: 32px;
        right: 6px;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.65);
        z-index: 3;
    }

    .status-overlay:empty {
        display: none;
    }

    .status-overlay.zzz {
        color: #94a3b8;
    }

    .status-overlay.done {
        color: #6b7280;
    }
</style>

<div class="card-border">
    <div class="frame">
        <div class="cost"></div>
        <div class="art-wrap"><div class="art"></div></div>
        <div class="name"></div>
        <div class="type-line"></div>
        <div class="body">
            <div class="effect"></div>
        </div>
        <div class="stats"></div>
        <div class="status-overlay"></div>
    </div>
</div>
`

export default class TcgCard extends HTMLElement {

    static get observedAttributes() {
        return [
            'name', 'cost', 'type', 'power', 'hp', 'effect',
            'definition-id', 'playable', 'can-attack', 'selected',
            'summoning-sickness', 'has-attacked'
        ]
    }

    /** @type {Object} Refs vers les éléments internes */
    _els

    /** @type {string} Dernier definition-id chargé (évite rechargement image inutile) */
    _loadedArtId

    /** @type {number|null} Timer pour la détection du long press */
    _longPressTimer

    /** @type {boolean} Indique si un drag a démarré (annule le long press) */
    _dragStarted

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._loadedArtId = ''
        this._longPressTimer = null
        this._dragStarted = false
        this._els = {
            border: this.shadowRoot.querySelector('.card-border'),
            frame: this.shadowRoot.querySelector('.frame'),
            cost: this.shadowRoot.querySelector('.cost'),
            art: this.shadowRoot.querySelector('.art'),
            name: this.shadowRoot.querySelector('.name'),
            typeLine: this.shadowRoot.querySelector('.type-line'),
            effect: this.shadowRoot.querySelector('.effect'),
            stats: this.shadowRoot.querySelector('.stats'),
            status: this.shadowRoot.querySelector('.status-overlay'),
        }

        this._setupInspectListeners()
    }

    /**
     * Configure les listeners pour l'inspection de carte :
     * - Clic droit (contextmenu) → dispatch card-inspect
     * - Appui long (touchstart/touchend) → dispatch card-inspect
     */
    _setupInspectListeners() {
        this.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            this._dispatchInspect()
        })

        this.addEventListener('touchstart', () => {
            this._dragStarted = false
            this._longPressTimer = setTimeout(() => {
                if (!this._dragStarted) this._dispatchInspect()
                this._longPressTimer = null
            }, 500)
        }, { passive: true })

        this.addEventListener('touchmove', () => {
            this._dragStarted = true
            this._cancelLongPress()
        }, { passive: true })

        this.addEventListener('touchend', () => this._cancelLongPress())
        this.addEventListener('touchcancel', () => this._cancelLongPress())
    }

    _cancelLongPress() {
        if (this._longPressTimer !== null) {
            clearTimeout(this._longPressTimer)
            this._longPressTimer = null
        }
    }

    _dispatchInspect() {
        this.dispatchEvent(new CustomEvent('card-inspect', {
            bubbles: true,
            composed: true,
            detail: { cardId: this.getAttribute('data-card-id') }
        }))
    }

    attributeChangedCallback() {
        this._update()
    }

    _update() {
        const defId = this.getAttribute('definition-id') || ''
        const name = this.getAttribute('name') || defId
        const cost = this.getAttribute('cost') || ''
        const type = this.getAttribute('type') || ''
        const power = this.getAttribute('power')
        const hp = this.getAttribute('hp')
        const effect = this.getAttribute('effect') || ''

        // Content
        this._els.cost.textContent = cost
        this._els.name.textContent = name
        this._els.typeLine.textContent = type

        // Art (ne recharge que si definition-id change)
        if (defId && defId !== this._loadedArtId) {
            this._els.art.classList.remove('loaded')
            const imageUrl = `${PICSUM}/${defId}/240/160`
            // Charger l'image en background et tracker le load
            const img = new window.Image()
            img.onload = () => {
                this._els.art.classList.add('loaded')
            }
            img.src = imageUrl
            this._els.art.style.backgroundImage = `url(${imageUrl})`
            this._loadedArtId = defId
        }

        // Effect text
        this._els.effect.textContent = effect

        // Stats (creatures only)
        if (type === 'creature' && power !== null && hp !== null) {
            this._els.stats.innerHTML =
                `<span class="stat power">${power}</span>` +
                `<span class="stat hp">${hp}</span>`
        } else {
            this._els.stats.innerHTML = ''
        }

        // Status overlay
        const sick = this.hasAttribute('summoning-sickness')
        const done = this.hasAttribute('has-attacked')
        if (sick) {
            this._els.status.textContent = 'zzz'
            this._els.status.className = 'status-overlay zzz'
        } else if (done) {
            this._els.status.textContent = 'done'
            this._els.status.className = 'status-overlay done'
        } else {
            this._els.status.textContent = ''
            this._els.status.className = 'status-overlay'
        }

        // Apply classes to border (for gradient color) and frame (for type-specific styles)
        const border = this._els.border
        const frame = this._els.frame
        const isSpell = type === 'spell'
        const isPlayable = this.hasAttribute('playable')
        const isCanAttack = this.hasAttribute('can-attack')
        const isSelected = this.hasAttribute('selected')

        // Border classes (affect gradient color)
        border.classList.toggle('spell', isSpell)
        border.classList.toggle('playable', isPlayable)
        border.classList.toggle('can-attack', isCanAttack)
        border.classList.toggle('selected', isSelected)

        // Frame classes (affect inner content and states)
        frame.classList.toggle('spell', isSpell)
        frame.classList.toggle('playable', isPlayable)
        frame.classList.toggle('can-attack', isCanAttack)
        frame.classList.toggle('selected', isSelected)
        frame.classList.toggle('sick', sick)
        frame.classList.toggle('exhausted', done)
    }
}

customElements.define('tcg-card', TcgCard)
