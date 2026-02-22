/**
 * <target-modal> — Modale de selection de cible pour attaques et pouvoirs.
 *
 * Singleton attache a document.body. S'ouvre via open() avec la liste
 * des cibles eligibles. Emet un CustomEvent 'target-selected' quand
 * le joueur choisit une cible.
 */

const PICSUM = 'https://picsum.photos/seed'

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
        position: fixed;
        inset: 0;
        z-index: 450;
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
        background: rgba(0, 0, 0, 0.55);
        animation: fadeIn 0.2s ease-out;
    }

    /* ---- PANEL ---- */

    .panel {
        position: relative;
        z-index: 1;
        min-width: 260px;
        max-width: 90vw;
        border-radius: 16px;
        overflow: hidden;
        background: rgba(20, 20, 30, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        animation: slideUp 0.25s ease-out;
    }

    /* ---- TITLE ---- */

    .title {
        padding: 14px 18px 10px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
    }

    /* ---- TARGET LIST ---- */

    .targets {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 0 14px 14px;
        justify-content: center;
    }

    /* ---- TARGET CARD ---- */

    .target-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100px;
        padding: 10px 8px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .target-card:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
    }

    .target-art {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #3a3a4a center / cover no-repeat;
        border: 2px solid rgba(255, 255, 255, 0.15);
        margin-bottom: 6px;
    }

    .target-name {
        font-size: 11px;
        font-weight: 700;
        color: #e8e8e8;
        margin-bottom: 6px;
        text-align: center;
    }

    .target-stats {
        display: flex;
        gap: 4px;
    }

    .target-stat {
        width: 24px;
        height: 18px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        color: white;
    }

    .target-stat.power { background: #E94560; }
    .target-stat.hp { background: #5B8C5A; }
    .target-stat.armor { background: #60a5fa; }

    /* ---- CANCEL ---- */

    .cancel-row {
        padding: 0 14px 14px;
        display: flex;
        justify-content: center;
    }

    .cancel-btn {
        padding: 6px 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.12s, color 0.12s;
    }

    .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
    }

    /* ---- ANIMATIONS ---- */

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>

<div class="backdrop"></div>
<div class="panel">
    <div class="title"></div>
    <div class="targets"></div>
    <div class="cancel-row">
        <button class="cancel-btn">Cancel</button>
    </div>
</div>
`

export default class TargetModal extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._title = this.shadowRoot.querySelector('.title')
        this._targets = this.shadowRoot.querySelector('.targets')
        this._backdrop = this.shadowRoot.querySelector('.backdrop')
        this._cancelBtn = this.shadowRoot.querySelector('.cancel-btn')

        this._backdrop.addEventListener('click', () => this.close())
        this._cancelBtn.addEventListener('click', () => this.close())
        this._onKeyDown = (e) => {
            if (e.key === 'Escape') this.close()
        }
    }

    /**
     * Ouvre la modale avec la liste des cibles eligibles.
     *
     * @param {Object} opts
     * @param {Object[]} opts.targets - [{ id, heroDefId, hp, maxHp, power, armor }]
     * @param {string} opts.action - 'attack' | 'power'
     */
    open({ targets, action }) {
        this._title.textContent = action === 'attack' ? 'Select attack target' : 'Select target'
        this._targets.innerHTML = ''

        for (const target of targets) {
            this._targets.appendChild(this._createTargetCard(target))
        }

        this.classList.add('visible')
        document.addEventListener('keydown', this._onKeyDown)
    }

    close() {
        this.classList.remove('visible')
        document.removeEventListener('keydown', this._onKeyDown)
    }

    _createTargetCard(target) {
        const card = document.createElement('div')
        card.className = 'target-card'

        // Portrait
        const art = document.createElement('div')
        art.className = 'target-art'
        art.style.backgroundImage = `url(${PICSUM}/${target.heroDefId}/112/112)`

        // Nom
        const name = document.createElement('div')
        name.className = 'target-name'
        name.textContent = target.heroDefId

        // Stats
        const stats = document.createElement('div')
        stats.className = 'target-stats'

        const powerStat = document.createElement('span')
        powerStat.className = 'target-stat power'
        powerStat.textContent = target.power
        stats.appendChild(powerStat)

        const hpStat = document.createElement('span')
        hpStat.className = 'target-stat hp'
        hpStat.textContent = target.hp
        stats.appendChild(hpStat)

        if (target.armor > 0) {
            const armorStat = document.createElement('span')
            armorStat.className = 'target-stat armor'
            armorStat.textContent = target.armor
            stats.appendChild(armorStat)
        }

        card.append(art, name, stats)

        card.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('target-selected', {
                bubbles: true,
                composed: true,
                detail: { targetId: target.id }
            }))
            this.close()
        })

        return card
    }
}

customElements.define('target-modal', TargetModal)
