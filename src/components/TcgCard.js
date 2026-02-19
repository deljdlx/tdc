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
        height: calc(var(--card-width, 100px) * 1.4);
        user-select: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ---- FRAME ---- */

    .frame {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 10px;
        overflow: hidden;
        background: linear-gradient(170deg, #1b2845 0%, #0c1222 50%, #141e33 100%);
        border: 2px solid #3a4d6e;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        cursor: default;
    }

    .frame::before {
        content: '';
        position: absolute;
        inset: 2px;
        border-radius: 7px;
        border: 1px solid rgba(255, 215, 0, 0.08);
        pointer-events: none;
        z-index: 1;
    }

    .frame::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 8px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08),
                    inset 0 -3px 8px rgba(0,0,0,0.5);
        pointer-events: none;
        z-index: 1;
    }

    .frame.spell {
        background: linear-gradient(170deg, #2a1848 0%, #130d2a 50%, #1c1435 100%);
        border-color: #4a3578;
    }

    .frame.spell::before {
        border-color: rgba(180, 130, 255, 0.1);
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
        top: 4px;
        left: 4px;
        width: 22px;
        height: 22px;
        background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        z-index: 3;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6),
                    0 0 4px rgba(59, 130, 246, 0.4),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    }

    .spell .cost {
        background: radial-gradient(circle at 35% 35%, #d8b4fe 0%, #a855f7 50%, #7c3aed 100%);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6),
                    0 0 4px rgba(168, 85, 247, 0.4),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
    }

    /* ---- ART ---- */

    .art-wrap {
        position: relative;
        margin: 5px 5px 0;
        flex: 1;
        min-height: 0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255, 215, 0, 0.12);
        box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
    }

    .spell .art-wrap {
        border-color: rgba(180, 130, 255, 0.15);
    }

    .art {
        position: absolute;
        inset: 0;
        background: #080c18 center / cover no-repeat;
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
            linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%),
            linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%);
        pointer-events: none;
    }

    /* ---- NAME BANNER ---- */

    .name {
        padding: 3px 6px;
        font-size: 8.5px;
        font-weight: 700;
        color: #f5d060;
        text-align: center;
        letter-spacing: 0.4px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        background: linear-gradient(180deg,
            rgba(20, 30, 50, 0.85) 0%,
            rgba(15, 22, 40, 0.95) 50%,
            rgba(20, 30, 50, 0.85) 100%);
        border-top: 1px solid rgba(255, 215, 0, 0.12);
        border-bottom: 1px solid rgba(255, 215, 0, 0.08);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
    }

    .spell .name {
        color: #d4bfff;
        border-top-color: rgba(180, 130, 255, 0.15);
        border-bottom-color: rgba(180, 130, 255, 0.08);
    }

    /* ---- TYPE LINE ---- */

    .type-line {
        padding: 1px 6px 2px;
        font-size: 6.5px;
        color: #7b8fac;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        flex-shrink: 0;
    }

    /* ---- BODY (effect text) ---- */

    .body {
        padding: 1px 6px 2px;
        min-height: 0;
        flex-shrink: 0;
    }

    .effect {
        font-size: 7px;
        color: #fbbf24;
        text-align: center;
        font-style: italic;
        line-height: 1.3;
    }

    .effect:empty {
        display: none;
    }

    /* ---- STATS ---- */

    .stats {
        display: flex;
        justify-content: space-between;
        padding: 0 4px 4px;
        gap: 2px;
        flex-shrink: 0;
    }

    .stats:empty {
        display: none;
    }

    .stat {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
    }

    .power {
        background: radial-gradient(circle at 35% 35%, #f87171 0%, #ef4444 50%, #b91c1c 100%);
        box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.25);
    }

    .hp {
        background: radial-gradient(circle at 35% 35%, #4ade80 0%, #22c55e 50%, #15803d 100%);
        box-shadow: 0 2px 5px rgba(34, 197, 94, 0.4),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.25);
    }

    /* ---- STATUS OVERLAY ---- */

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
