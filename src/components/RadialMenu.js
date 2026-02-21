/**
 * <radial-menu> — Menu radial d'actions pour un hero.
 *
 * Singleton attache a document.body. S'ouvre via open() et se ferme
 * au clic en dehors ou via close().
 *
 * Emet un CustomEvent 'hero-action' avec le detail de l'action choisie.
 */

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
        position: fixed;
        inset: 0;
        z-index: 400;
        display: none;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    :host(.visible) {
        display: block;
    }

    .backdrop {
        position: absolute;
        inset: 0;
    }

    .menu {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px;
        background: rgba(20, 20, 30, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        min-width: 140px;
        animation: menuIn 0.15s ease-out;
    }

    @keyframes menuIn {
        from {
            opacity: 0;
            transform: scale(0.85);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .menu-title {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: rgba(255, 255, 255, 0.45);
        padding: 4px 8px 2px;
    }

    .separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 2px 4px;
    }

    .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #e8e8e8;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.12s;
        text-align: left;
    }

    .action-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
    }

    .action-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .action-icon {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        flex-shrink: 0;
    }

    .action-icon.attack { background: rgba(233, 69, 96, 0.25); color: #e94560; }
    .action-icon.defend { background: rgba(96, 165, 250, 0.25); color: #60a5fa; }
    .action-icon.power { background: rgba(251, 191, 36, 0.25); color: #fbbf24; }

    .action-label {
        flex: 1;
    }

    .action-cost {
        font-size: 10px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.06);
    }
</style>

<div class="backdrop"></div>
<div class="menu"></div>
`

export default class RadialMenu extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))

        this._menu = this.shadowRoot.querySelector('.menu')
        this._backdrop = this.shadowRoot.querySelector('.backdrop')

        this._backdrop.addEventListener('click', () => this.close())
    }

    /**
     * Ouvre le menu pour un hero donne.
     *
     * @param {Object} opts
     * @param {string} opts.heroId
     * @param {string} opts.playerId
     * @param {string} opts.heroClass
     * @param {number} opts.x - Position X viewport
     * @param {number} opts.y - Position Y viewport
     * @param {number} opts.ap - AP disponibles
     * @param {boolean} opts.hasActed - Si le hero a deja agi
     * @param {Object[]} opts.powers - Pouvoirs disponibles
     */
    open({ heroId, playerId, heroClass, x, y, ap, hasActed, powers }) {
        this._menu.innerHTML = ''

        // Titre
        const title = document.createElement('div')
        title.className = 'menu-title'
        title.textContent = heroClass
        this._menu.appendChild(title)

        // Attack
        this._addButton({
            icon: '\u2694',
            iconClass: 'attack',
            label: 'Attack',
            disabled: hasActed,
            onClick: () => this._emit({ action: 'attack', heroId, playerId })
        })

        // Defend
        this._addButton({
            icon: '\u{1F6E1}',
            iconClass: 'defend',
            label: 'Defend',
            disabled: hasActed,
            onClick: () => this._emit({ action: 'defend', heroId, playerId })
        })

        // Separator before powers
        if (powers.length > 0) {
            const sep = document.createElement('div')
            sep.className = 'separator'
            this._menu.appendChild(sep)
        }

        // Powers
        for (const power of powers) {
            const notEnoughAp = ap < power.apCost
            const blocked = (!power.freeAction && hasActed) || notEnoughAp
            this._addButton({
                icon: '\u2726',
                iconClass: 'power',
                label: power.name,
                cost: `${power.apCost} AP`,
                disabled: blocked,
                title: power.description,
                onClick: () => this._emit({
                    action: 'power',
                    heroId,
                    playerId,
                    powerId: power.id,
                    targetType: power.targetType
                })
            })
        }

        // Position
        this._menu.style.left = `${x}px`
        this._menu.style.top = `${y}px`

        this.classList.add('visible')

        // Ajuster si le menu deborde
        requestAnimationFrame(() => {
            const rect = this._menu.getBoundingClientRect()
            if (rect.right > window.innerWidth) {
                this._menu.style.left = `${x - rect.width}px`
            }
            if (rect.bottom > window.innerHeight) {
                this._menu.style.top = `${y - rect.height}px`
            }
        })
    }

    close() {
        this.classList.remove('visible')
    }

    _addButton({ icon, iconClass, label, cost, disabled, title, onClick }) {
        const btn = document.createElement('button')
        btn.className = 'action-btn'
        btn.disabled = !!disabled
        if (title) btn.title = title

        const iconEl = document.createElement('span')
        iconEl.className = `action-icon ${iconClass}`
        iconEl.textContent = icon

        const labelEl = document.createElement('span')
        labelEl.className = 'action-label'
        labelEl.textContent = label

        btn.append(iconEl, labelEl)

        if (cost) {
            const costEl = document.createElement('span')
            costEl.className = 'action-cost'
            costEl.textContent = cost
            btn.appendChild(costEl)
        }

        btn.addEventListener('click', () => {
            this.close()
            onClick()
        })

        this._menu.appendChild(btn)
    }

    _emit(detail) {
        this.dispatchEvent(new CustomEvent('hero-action', {
            bubbles: true,
            composed: true,
            detail
        }))
    }
}

customElements.define('radial-menu', RadialMenu)
