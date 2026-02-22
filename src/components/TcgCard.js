/**
 * <tcg-card> — Custom Element pour l'affichage d'une carte TCG.
 *
 * Attributes observés :
 *   name, cost, type, power, hp, effect, definition-id,
 *   playable, can-attack, selected, summoning-sickness, has-acted,
 *   is-defending, armor
 *
 * L'illustration utilise Lorem Picsum avec un seed basé sur definition-id
 * pour garantir la même image par type de carte.
 *
 * Theming via CSS custom properties :
 *   --card-width  (défaut 100px)
 */

const PICSUM = 'https://picsum.photos/seed'

const INNER_HTML = `
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
</div>`

export default class TcgCard extends HTMLElement {

    static get observedAttributes() {
        return [
            'name', 'cost', 'type', 'power', 'hp', 'effect',
            'definition-id', 'playable', 'can-attack', 'selected',
            'summoning-sickness', 'has-acted', 'is-defending',
            'armor'
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
        this.innerHTML = INNER_HTML

        this._loadedArtId = ''
        this._longPressTimer = null
        this._dragStarted = false
        this._els = {
            border: this.querySelector('.card-border'),
            frame: this.querySelector('.frame'),
            cost: this.querySelector('.cost'),
            art: this.querySelector('.art'),
            name: this.querySelector('.name'),
            typeLine: this.querySelector('.type-line'),
            effect: this.querySelector('.effect'),
            stats: this.querySelector('.stats'),
            status: this.querySelector('.status-overlay'),
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

        // Stats (heroes)
        const armor = this.getAttribute('armor')
        if ((type === 'creature' || type === 'hero') && power !== null && hp !== null) {
            let statsHtml =
                `<span class="stat power">${power}</span>` +
                `<span class="stat hp">${hp}</span>`
            if (armor && Number(armor) > 0) {
                statsHtml += `<span class="stat armor">${armor}</span>`
            }
            this._els.stats.innerHTML = statsHtml
        } else {
            this._els.stats.innerHTML = ''
        }

        // Status overlay
        const sick = this.hasAttribute('summoning-sickness')
        const done = this.hasAttribute('has-acted')
        const defending = this.hasAttribute('is-defending')
        if (defending) {
            this._els.status.textContent = 'defending'
            this._els.status.className = 'status-overlay defending'
        } else if (sick) {
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
        border.classList.toggle('defending', defending)

        // Frame classes (affect inner content and states)
        frame.classList.toggle('spell', isSpell)
        frame.classList.toggle('playable', isPlayable)
        frame.classList.toggle('can-attack', isCanAttack)
        frame.classList.toggle('selected', isSelected)
        frame.classList.toggle('defending', defending)
        frame.classList.toggle('sick', sick)
        frame.classList.toggle('exhausted', done)
    }
}

customElements.define('tcg-card', TcgCard)
