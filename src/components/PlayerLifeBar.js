/**
 * <player-life-bar> — barre de vie réutilisable.
 *
 * Attributes:
 *   value, max, label, size, color, glow, variant, width, height, show-text
 */

export default class PlayerLifeBar extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'max', 'label', 'size', 'color', 'glow', 'variant', 'width', 'height', 'show-text']
    }

    constructor() {
        super()
        this._prevPct = null
        this._changeFxTimer = null
        this._els = null
    }

    connectedCallback() {
        if (this._els) return

        this.innerHTML = `
            <span class="plb-label"></span>
            <div class="plb-bar-frame">
                <div class="plb-fill"></div>
            </div>
            <span class="plb-value"></span>
        `

        this._els = {
            label: this.querySelector('.plb-label'),
            value: this.querySelector('.plb-value'),
            fill: this.querySelector('.plb-fill'),
            frame: this.querySelector('.plb-bar-frame')
        }

        this._update()
    }

    disconnectedCallback() {
        if (this._changeFxTimer) {
            clearTimeout(this._changeFxTimer)
            this._changeFxTimer = null
        }
    }

    attributeChangedCallback() {
        if (!this._els) return
        this._update()
    }

    _update() {
        const value = parseInt(this.getAttribute('value')) || 0
        const max = parseInt(this.getAttribute('max')) || 0
        const label = this.getAttribute('label') || 'HP'
        const color = this.getAttribute('color')
        const glow = this.getAttribute('glow')

        const safeMax = max > 0 ? max : 1
        const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))

        this._els.label.textContent = label
        this._els.value.textContent = `${value}/${max || 0}`
        this._els.fill.style.width = `${pct}%`

        this._syncSize()
        this._syncColors(pct, color, glow)
        this._syncState(pct)
        this._syncPulse(pct)
        this._syncChangeAnimation(this._prevPct, pct)
        this._prevPct = pct
    }

    _syncSize() {
        const width = this.getAttribute('width')
        const height = this.getAttribute('height')

        this._applySizeToken('--life-bar-width', width)
        this._applySizeToken('--life-bar-height', height)
    }

    _applySizeToken(token, value) {
        if (!value) {
            this.style.removeProperty(token)
            return
        }

        if (/^\d+(\.\d+)?$/.test(value)) {
            this.style.setProperty(token, `${value}px`)
        } else {
            this.style.setProperty(token, value)
        }
    }

    _syncColors(pct, color, glow) {
        if (color) {
            this.style.setProperty('--life-bar-color', color)
            this.style.setProperty('--life-bar-glow', glow || 'rgba(255, 255, 255, 0.35)')
            return
        }

        const clamped = Math.max(0, Math.min(100, pct))
        const hue = Math.round((clamped / 100) * 120)
        const danger = 1 - (clamped / 100)
        const glowAlpha = 0.32 + (danger * 0.4)

        this.style.setProperty('--life-bar-color', `hsl(${hue} 88% 52%)`)
        this.style.setProperty('--life-bar-glow', `hsl(${hue} 95% 55% / ${glowAlpha.toFixed(2)})`)
    }

    _syncState(pct) {
        if (pct <= 30 && pct > 0) {
            this.setAttribute('low', '')
        } else {
            this.removeAttribute('low')
        }
    }

    _syncPulse(pct) {
        const clamped = Math.max(0, Math.min(100, pct))
        const danger = 1 - (clamped / 100)
        const pulseStrength = 0.15 + (danger * 1.05)
        const pulseDuration = 2.6 - (danger * 1.9)

        this.style.setProperty('--life-pulse-strength', `${pulseStrength.toFixed(2)}`)
        this.style.setProperty('--life-pulse-duration', `${pulseDuration.toFixed(2)}s`)
    }

    _syncChangeAnimation(prevPct, currentPct) {
        if (prevPct == null || prevPct === currentPct) {
            return
        }

        const frame = this._els.frame
        const changeClass = currentPct < prevPct ? 'hp-hit' : 'hp-heal'
        const intensity = Math.max(0.2, Math.min(1, Math.abs(currentPct - prevPct) / 45))

        frame.classList.remove('hp-hit', 'hp-heal')
        void frame.offsetWidth
        this.style.setProperty('--life-change-boost', intensity.toFixed(2))
        frame.classList.add(changeClass)

        if (this._changeFxTimer) {
            clearTimeout(this._changeFxTimer)
        }

        this._changeFxTimer = setTimeout(() => {
            frame.classList.remove('hp-hit', 'hp-heal')
            this._changeFxTimer = null
        }, 460)
    }
}

customElements.define('player-life-bar', PlayerLifeBar)
