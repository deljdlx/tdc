/**
 * <card-modal> — Modale d'inspection de carte TCG.
 *
 * Affiche les stats détaillées d'une carte dans un overlay plein écran.
 * S'ouvre via la méthode open(cardData) et se ferme au clic sur le backdrop
 * ou via la méthode close().
 *
 * Conçu pour être instancié une seule fois et réutilisé (attaché à document.body).
 */

import { EFFECT_LABELS } from '../gameplay/definitions/effectLabels.js'

const PICSUM = 'https://picsum.photos/seed'

const INNER_HTML = `
<div class="backdrop"></div>
<div class="card-panel">
    <div class="cost"></div>
    <div class="art-wrap"><div class="art"></div></div>
    <div class="name"></div>
    <div class="type-line"></div>
    <div class="stats-row"></div>
    <div class="effect-section"><div class="effect-text"></div></div>
    <div class="status-section"></div>
</div>`

export default class CardModal extends HTMLElement {

    /** @type {Object} Refs vers les éléments internes */
    _els

    /** @type {HTMLImageElement|null} Image en cours de chargement */
    _pendingImg

    constructor() {
        super()
        this._els = null
        this._pendingImg = null
        this._onKeyDown = (e) => {
            if (e.key === 'Escape') this.close()
        }
    }

    connectedCallback() {
        if (this._els) return

        this.innerHTML = INNER_HTML

        this._els = {
            backdrop: this.querySelector('.backdrop'),
            panel: this.querySelector('.card-panel'),
            cost: this.querySelector('.cost'),
            art: this.querySelector('.art'),
            name: this.querySelector('.name'),
            typeLine: this.querySelector('.type-line'),
            statsRow: this.querySelector('.stats-row'),
            effectText: this.querySelector('.effect-text'),
            effectSection: this.querySelector('.effect-section'),
            statusSection: this.querySelector('.status-section'),
        }

        this._els.backdrop.addEventListener('click', () => this.close())
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
     * @param {boolean} [data.hasActed]
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

        // Illustration (annule le chargement précédent pour éviter une race)
        if (this._pendingImg) this._pendingImg.onload = null
        art.classList.remove('loaded')
        if (data.definitionId) {
            const url = `${PICSUM}/${data.definitionId}/240/160`
            const img = new window.Image()
            img.onload = () => art.classList.add('loaded')
            img.src = url
            art.style.backgroundImage = `url(${url})`
            this._pendingImg = img
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
        if (data.isDefending) badges.push('<span class="status-badge defending">Defending</span>')
        if (data.armor > 0) badges.push(`<span class="status-badge armor">Armor: ${data.armor}</span>`)
        if (data.summoningSickness) badges.push('<span class="status-badge sick">Summoning Sickness</span>')
        if (data.hasActed) badges.push('<span class="status-badge exhausted">Exhausted</span>')
        if (data.canAttack) badges.push('<span class="status-badge can-attack">Ready to Attack</span>')
        statusSection.innerHTML = badges.join('')
        statusSection.style.display = badges.length ? '' : 'none'
    }
}

customElements.define('card-modal', CardModal)
