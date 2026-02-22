/**
 * <target-modal> — Modale de selection de cible pour attaques et pouvoirs.
 *
 * Singleton attache a document.body. S'ouvre via open() avec la liste
 * des cibles eligibles. Emet un CustomEvent 'target-selected' quand
 * le joueur choisit une cible.
 */

const PICSUM = 'https://picsum.photos/seed'

const INNER_HTML = `
<div class="backdrop"></div>
<div class="panel">
    <div class="title"></div>
    <div class="targets"></div>
    <div class="cancel-row">
        <button class="cancel-btn">Cancel</button>
    </div>
</div>`

export default class TargetModal extends HTMLElement {
    constructor() {
        super()
        this._title = null
        this._targets = null
        this._onKeyDown = (e) => {
            if (e.key === 'Escape') this.close()
        }
    }

    connectedCallback() {
        if (this._title) return

        this.innerHTML = INNER_HTML

        this._title = this.querySelector('.title')
        this._targets = this.querySelector('.targets')

        this.querySelector('.backdrop').addEventListener('click', () => this.close())
        this.querySelector('.cancel-btn').addEventListener('click', () => this.close())
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
                detail: { targetId: target.id }
            }))
            this.close()
        })

        return card
    }
}

customElements.define('target-modal', TargetModal)
