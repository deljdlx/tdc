/**
 * <card-modal> — Modale d'inspection de carte TCG.
 *
 * Affiche les stats détaillées d'une carte dans un overlay plein écran.
 * S'ouvre via la méthode open(cardData) et se ferme au clic sur le backdrop
 * ou via la méthode close().
 *
 * Conçu pour être instancié une seule fois et réutilisé (attaché à document.body).
 */

const PICSUM = 'https://picsum.photos/seed'

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
        position: fixed;
        inset: 0;
        z-index: 500;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    :host(.visible) {
        display: flex;
    }

    /* ---- BACKDROP ---- */

    .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.2s ease-out;
    }

    /* ---- CARD PANEL ---- */

    .card-panel {
        position: relative;
        z-index: 1;
        width: 280px;
        max-width: 90vw;
        border-radius: 16px;
        overflow: hidden;
        background: #FFFFFF;
        border: 2px solid #D5D2CC;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
        animation: slideUp 0.25s ease-out;
    }

    .card-panel.spell {
        background: #FAF8FF;
        border-color: #B8A9D4;
    }

    /* ---- ART ---- */

    .art-wrap {
        position: relative;
        height: 160px;
        margin: 10px 10px 0;
        border-radius: 10px;
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

    /* ---- COST GEM ---- */

    .cost {
        position: absolute;
        top: 14px;
        left: 14px;
        width: 36px;
        height: 36px;
        background: #7BA7CC;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 800;
        z-index: 3;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
        border: 2px solid #5889B0;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    .spell .cost {
        background: #9B8EC4;
        border-color: #7A6DA8;
    }

    /* ---- NAME ---- */

    .name {
        padding: 10px 14px 6px;
        font-size: 18px;
        font-weight: 700;
        color: #2D3436;
        text-align: center;
        letter-spacing: 0.8px;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    .spell .name {
        color: #4A3D6B;
    }

    /* ---- TYPE LINE ---- */

    .type-line {
        padding: 4px 14px;
        font-size: 11px;
        color: #7F8C8D;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        background: transparent;
        border-top: 1px solid #E8E6E1;
        border-bottom: 1px solid #E8E6E1;
    }

    /* ---- STATS ---- */

    .stats-row {
        display: flex;
        justify-content: center;
        gap: 16px;
        padding: 12px 14px;
    }

    .stat-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
    }

    .stat-value {
        width: 38px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 800;
        color: white;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    .stat-value.power {
        background: #E94560;
    }

    .stat-value.hp {
        background: #5B8C5A;
    }

    .stat-label {
        font-size: 9px;
        color: #7F8C8D;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
    }

    /* ---- EFFECT TEXT ---- */

    .effect-section {
        padding: 10px 14px;
        margin: 0 10px;
        background: #FAFAF7;
        border-radius: 6px;
        border: 1px solid #E8E6E1;
    }

    .effect-text {
        font-size: 13px;
        color: #2D3436;
        text-align: center;
        font-style: italic;
        line-height: 1.5;
        font-weight: 500;
    }

    .effect-text:empty {
        display: none;
    }

    /* ---- STATUS ---- */

    .status-section {
        padding: 8px 14px 14px;
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .status-badge {
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .status-badge.sick {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .status-badge.exhausted {
        background: rgba(107, 114, 128, 0.15);
        color: #6b7280;
        border: 1px solid rgba(107, 114, 128, 0.3);
    }

    .status-badge.can-attack {
        background: rgba(233, 69, 96, 0.15);
        color: #e94560;
        border: 1px solid rgba(233, 69, 96, 0.3);
    }

    /* ---- ANIMATIONS ---- */

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>

<div class="backdrop"></div>
<div class="card-panel">
    <div class="cost"></div>
    <div class="art-wrap"><div class="art"></div></div>
    <div class="name"></div>
    <div class="type-line"></div>
    <div class="stats-row"></div>
    <div class="effect-section"><div class="effect-text"></div></div>
    <div class="status-section"></div>
</div>
`

const EFFECT_LABELS = {
    DEAL_DAMAGE: (v) => `Deal ${v} damage`,
    RESTORE_HP: (v) => `Restore ${v} HP`
}

export default class CardModal extends HTMLElement {

    /** @type {Object} Refs vers les éléments internes */
    _els

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._els = {
            backdrop: this.shadowRoot.querySelector('.backdrop'),
            panel: this.shadowRoot.querySelector('.card-panel'),
            cost: this.shadowRoot.querySelector('.cost'),
            art: this.shadowRoot.querySelector('.art'),
            name: this.shadowRoot.querySelector('.name'),
            typeLine: this.shadowRoot.querySelector('.type-line'),
            statsRow: this.shadowRoot.querySelector('.stats-row'),
            effectText: this.shadowRoot.querySelector('.effect-text'),
            effectSection: this.shadowRoot.querySelector('.effect-section'),
            statusSection: this.shadowRoot.querySelector('.status-section'),
        }

        this._els.backdrop.addEventListener('click', () => this.close())
        this._onKeyDown = (e) => {
            if (e.key === 'Escape') this.close()
        }
    }

    /**
     * Ouvre la modale avec les données d'une carte.
     *
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.type - 'creature' | 'spell'
     * @param {number} data.cost
     * @param {string} data.definitionId
     * @param {number} [data.power]
     * @param {number} [data.hp]
     * @param {string} [data.effect]
     * @param {number} [data.effectValue]
     * @param {boolean} [data.summoningSickness]
     * @param {boolean} [data.hasAttacked]
     * @param {boolean} [data.canAttack]
     */
    open(data) {
        this._populate(data)
        this.classList.add('visible')
        document.addEventListener('keydown', this._onKeyDown)
    }

    close() {
        this.classList.remove('visible')
        document.removeEventListener('keydown', this._onKeyDown)
    }

    _populate(data) {
        const { panel, cost, art, name, typeLine, statsRow, effectText, effectSection, statusSection } = this._els

        // Type de carte (frame)
        panel.classList.toggle('spell', data.type === 'spell')

        // Coût
        cost.textContent = data.cost

        // Illustration
        art.classList.remove('loaded')
        if (data.definitionId) {
            const url = `${PICSUM}/${data.definitionId}/240/160`
            const img = new window.Image()
            img.onload = () => art.classList.add('loaded')
            img.src = url
            art.style.backgroundImage = `url(${url})`
        }

        // Nom et type
        name.textContent = data.name || data.definitionId || ''
        typeLine.textContent = data.type || ''

        // Stats (creatures / heroes)
        if ((data.type === 'creature' || data.type === 'hero') && data.power != null && data.hp != null) {
            statsRow.innerHTML = `
                <div class="stat-block">
                    <div class="stat-value power">${data.power}</div>
                    <div class="stat-label">Power</div>
                </div>
                <div class="stat-block">
                    <div class="stat-value hp">${data.hp}</div>
                    <div class="stat-label">HP</div>
                </div>
            `
            statsRow.style.display = ''
        } else {
            statsRow.innerHTML = ''
            statsRow.style.display = 'none'
        }

        // Effet (sorts)
        const fmt = EFFECT_LABELS[data.effect]
        const effectLabel = fmt ? fmt(data.effectValue) : data.effect || ''
        effectText.textContent = effectLabel
        effectSection.style.display = effectLabel ? '' : 'none'

        // Status badges
        const badges = []
        if (data.summoningSickness) badges.push('<span class="status-badge sick">Summoning Sickness</span>')
        if (data.hasAttacked) badges.push('<span class="status-badge exhausted">Exhausted</span>')
        if (data.canAttack) badges.push('<span class="status-badge can-attack">Ready to Attack</span>')
        statusSection.innerHTML = badges.join('')
        statusSection.style.display = badges.length ? '' : 'none'
    }
}

customElements.define('card-modal', CardModal)
