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
    :host {
        display: inline-block;
        width: var(--card-width, 100px);
        height: calc(var(--card-width, 100px) * 1.2);
        user-select: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ---- FRAME ---- */

    .frame {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 8px;
        overflow: hidden;
        background: linear-gradient(170deg, #1e2a4a 0%, #0d1528 100%);
        border: 2px solid #2a3a5c;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        cursor: default;
    }

    .frame::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 6px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06),
                    inset 0 -2px 6px rgba(0,0,0,0.4);
        pointer-events: none;
    }

    .frame.spell {
        background: linear-gradient(170deg, #241a4a 0%, #110d28 100%);
        border-color: #3a2a6c;
    }

    /* ---- STATES ---- */

    .frame.playable {
        border-color: #4ade80;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(74, 222, 128, 0.25),
                    0 0 3px rgba(74, 222, 128, 0.15);
    }
    .frame.playable:hover {
        transform: perspective(400px) rotateX(-8deg) translateY(-12px) scale(1.05);
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.5),
                    0 16px 32px rgba(0, 0, 0, 0.6);
    }

    .frame.can-attack {
        border-color: #e94560;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(233, 69, 96, 0.25);
    }
    .frame.can-attack:hover {
        box-shadow: 0 0 20px rgba(233, 69, 96, 0.5),
                    0 14px 28px rgba(0, 0, 0, 0.5);
        transform: perspective(400px) rotateX(-8deg) translateY(-10px) scale(1.05);
    }

    .frame.selected {
        border-color: #f0c040;
        box-shadow: 0 0 16px rgba(240, 192, 64, 0.5),
                    0 0 4px rgba(240, 192, 64, 0.3);
    }

    .frame.exhausted {
        opacity: 0.55;
    }

    .frame.sick {
        filter: saturate(0.4) brightness(0.85);
        transition: filter 1.2s ease-in;
    }

    /* ---- DRAG & DROP ---- */

    :host([draggable="true"]) .frame {
        cursor: grab;
    }

    :host(.dragging) .frame {
        opacity: 0.3;
        filter: grayscale(0.5) brightness(0.6);
    }

    :host([drop-hint]) .frame {
        border-color: #f59e0b;
        border-style: dashed;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
    }

    :host([drop-target]) .frame {
        border-color: #e94560;
        border-style: solid;
        box-shadow: 0 0 20px rgba(233, 69, 96, 0.5),
                    0 12px 24px rgba(0, 0, 0, 0.5);
        transform: perspective(400px) rotateX(-6deg) scale(1.06);
    }

    /* ---- COST GEM ---- */

    .cost {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        z-index: 2;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
    }

    /* ---- ART ---- */

    .art {
        position: relative;
        width: 100%;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        background: #080c18 center / cover;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
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
        background:
            linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 40%),
            linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.5) 100%);
        pointer-events: none;
    }

    /* ---- NAME ---- */

    .name {
        padding: 2px 4px 2px;
        font-size: 8px;
        font-weight: 700;
        color: #f0c040;
        text-align: center;
        letter-spacing: 0.3px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
    }

    .spell .name {
        color: #c4b5fd;
    }

    /* ---- TYPE LINE ---- */

    .type-line {
        padding: 1px 4px;
        font-size: 6px;
        color: #6b7fa0;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        flex-shrink: 0;
    }

    /* ---- BODY (effect text) ---- */

    .body {
        padding: 1px 4px 1px;
        min-height: 0;
        font-size: 6px;
        flex-shrink: 0;
    }

    .effect {
        font-size: 6px;
        color: #fbbf24;
        text-align: center;
        font-style: italic;
        line-height: 1.2;
    }

    .effect:empty {
        display: none;
    }

    /* ---- STATS ---- */

    .stats {
        display: flex;
        justify-content: space-between;
        padding: 1px 3px 1px;
        gap: 2px;
        flex-shrink: 0;
    }

    .stats:empty {
        display: none;
    }

    .stat {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 800;
        color: white;
    }

    .power {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.35),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .hp {
        background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.35),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    /* ---- STATUS OVERLAY ---- */

    .status-overlay {
        position: absolute;
        bottom: 28px;
        right: 6px;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.6);
        z-index: 2;
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

<div class="frame">
    <div class="cost"></div>
    <div class="art"></div>
    <div class="name"></div>
    <div class="type-line"></div>
    <div class="body">
        <div class="effect"></div>
    </div>
    <div class="stats"></div>
    <div class="status-overlay"></div>
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

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._loadedArtId = ''
        this._els = {
            frame: this.shadowRoot.querySelector('.frame'),
            cost: this.shadowRoot.querySelector('.cost'),
            art: this.shadowRoot.querySelector('.art'),
            name: this.shadowRoot.querySelector('.name'),
            typeLine: this.shadowRoot.querySelector('.type-line'),
            effect: this.shadowRoot.querySelector('.effect'),
            stats: this.shadowRoot.querySelector('.stats'),
            status: this.shadowRoot.querySelector('.status-overlay'),
        }
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
            const img = new Image()
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

        // Frame state classes
        const f = this._els.frame
        f.classList.toggle('spell', type === 'spell')
        f.classList.toggle('playable', this.hasAttribute('playable'))
        f.classList.toggle('can-attack', this.hasAttribute('can-attack'))
        f.classList.toggle('selected', this.hasAttribute('selected'))
        f.classList.toggle('sick', sick)
        f.classList.toggle('exhausted', done)
    }
}

customElements.define('tcg-card', TcgCard)
