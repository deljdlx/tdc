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
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Crimson+Pro:wght@400;600;700&display=swap');

    :host {
        display: inline-block;
        width: var(--card-width, 100px);
        height: calc(var(--card-width, 100px) * 1.4);
        user-select: none;
        font-family: 'Crimson Pro', 'Georgia', serif;
    }

    /* ---- FRAME ---- */

    .frame {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: 12px;
        overflow: hidden;
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.35) 100%),
            radial-gradient(circle at 20% 10%, rgba(255, 232, 180, 0.18) 0%, rgba(0, 0, 0, 0) 45%),
            #111a2b;
        border: 2px solid #b08a45;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        cursor: default;
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.55),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .frame::before {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: 8px;
        border: 1px solid rgba(255, 233, 186, 0.18);
        pointer-events: none;
        z-index: 1;
    }

    .frame::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 10px;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -4px 10px rgba(0, 0, 0, 0.6);
        background:
            repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0 2px, rgba(0, 0, 0, 0) 2px 4px);
        pointer-events: none;
        z-index: 1;
    }

    .frame.spell {
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.45) 100%),
            radial-gradient(circle at 20% 10%, rgba(210, 176, 255, 0.2) 0%, rgba(0, 0, 0, 0) 45%),
            #1a1230;
        border-color: #7f5db6;
    }

    .frame.spell::before {
        border-color: rgba(200, 165, 255, 0.2);
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
        font-size: 11px;
        font-weight: 800;
        z-index: 3;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6),
                    0 0 4px rgba(59, 130, 246, 0.4),
                    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        font-family: 'Cinzel', serif;
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
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid rgba(255, 233, 186, 0.25);
        box-shadow:
            inset 0 0 12px rgba(0, 0, 0, 0.65),
            0 2px 6px rgba(0, 0, 0, 0.4);
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
            linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%),
            linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.6) 100%);
        pointer-events: none;
    }

    /* ---- NAME BANNER ---- */

    .name {
        padding: 4px 6px 3px;
        font-size: 9px;
        font-weight: 700;
        color: #f9e2a7;
        text-align: center;
        letter-spacing: 0.6px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        background: linear-gradient(180deg,
            rgba(36, 28, 16, 0.92) 0%,
            rgba(20, 16, 10, 0.96) 50%,
            rgba(36, 28, 16, 0.92) 100%);
        border-top: 1px solid rgba(255, 233, 186, 0.25);
        border-bottom: 1px solid rgba(255, 233, 186, 0.18);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
        font-family: 'Cinzel', serif;
    }

    .spell .name {
        color: #e7d8ff;
        border-top-color: rgba(210, 180, 255, 0.28);
        border-bottom-color: rgba(210, 180, 255, 0.18);
    }

    /* ---- TYPE LINE ---- */

    .type-line {
        padding: 2px 6px;
        font-size: 6.5px;
        color: #d6c6a1;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: linear-gradient(90deg, rgba(10, 8, 6, 0.8), rgba(30, 24, 18, 0.4), rgba(10, 8, 6, 0.8));
        border-top: 1px solid rgba(255, 233, 186, 0.18);
        border-bottom: 1px solid rgba(255, 233, 186, 0.12);
        flex-shrink: 0;
    }

    /* ---- BODY (effect text) ---- */

    .body {
        padding: 4px 6px 4px;
        min-height: 0;
        flex-shrink: 0;
        background: linear-gradient(180deg, rgba(245, 231, 200, 0.92), rgba(220, 197, 156, 0.92));
        border-top: 1px solid rgba(255, 255, 255, 0.35);
        border-bottom: 1px solid rgba(70, 56, 36, 0.4);
    }

    .effect {
        font-size: 7px;
        color: #2f2518;
        text-align: center;
        font-style: italic;
        line-height: 1.3;
        font-weight: 600;
    }

    .effect:empty {
        display: none;
    }

    /* ---- STATS ---- */

    .stats {
        display: flex;
        justify-content: flex-end;
        padding: 2px 5px 5px;
        gap: 4px;
        flex-shrink: 0;
    }

    .stats:empty {
        display: none;
    }

    .stat {
        width: 22px;
        height: 18px;
        border-radius: 4px 4px 6px 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        color: #fef3c7;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.35);
        font-family: 'Cinzel', serif;
    }

    .power {
        background: linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%);
        box-shadow: 0 2px 5px rgba(185, 28, 28, 0.45);
    }

    .hp {
        background: linear-gradient(180deg, #15803d 0%, #14532d 100%);
        box-shadow: 0 2px 5px rgba(21, 128, 61, 0.45);
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
