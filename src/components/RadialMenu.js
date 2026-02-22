/**
 * <radial-menu> — Menu radial d'actions pour un hero.
 *
 * Singleton attache a document.body. S'ouvre via open() et se ferme
 * au clic en dehors ou via close().
 *
 * Emet un CustomEvent 'hero-action' avec le detail de l'action choisie.
 */

const INNER_HTML = `
<div class="backdrop"></div>
<div class="menu"></div>`

export default class RadialMenu extends HTMLElement {
    constructor() {
        super()
        this._menu = null
        this._backdrop = null
    }

    connectedCallback() {
        if (this._menu) return

        this.innerHTML = INNER_HTML
        this._menu = this.querySelector('.menu')
        this._backdrop = this.querySelector('.backdrop')

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
            detail
        }))
    }
}

customElements.define('radial-menu', RadialMenu)
