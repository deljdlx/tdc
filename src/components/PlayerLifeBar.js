/**
 * <player-life-bar> — barre de vie réutilisable.
 *
 * Attributes:
 *   value, max, label, size, color, glow, variant, width, height, show-text
 */

const TEMPLATE = document.createElement('template')
TEMPLATE.innerHTML = `
<style>
    :host {
        --life-bar-width: 140px;
        --life-bar-height: 12px;
        --life-bar-font: 11px;
        --life-bar-radius: 6px;
        --life-bar-color: #5B8C5A;
        --life-bar-glow: transparent;
        --life-fluid-core: #7BAF7A;
        --life-fluid-edge: #3D6B3C;
        --life-pulse-duration: 0s;
        --life-pulse-strength: 0;
        --life-shimmer-duration: 0s;
        --life-change-boost: 0.2;
        --life-bar-bg: #EDEBE6;
        --life-bar-frame: #D5D2CC;
        --life-bar-label: #7F8C8D;
        --life-bar-text: #2D3436;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    :host([size="sm"]) {
        --life-bar-width: 120px;
        --life-bar-height: 10px;
        --life-bar-font: 10px;
    }

    :host([size="lg"]) {
        --life-bar-width: 180px;
        --life-bar-height: 16px;
        --life-bar-font: 12px;
    }

    .label {
        font-size: 9px;
        font-weight: 700;
        color: var(--life-bar-label);
        min-width: 20px;
    }

    .value {
        font-size: var(--life-bar-font);
        font-weight: 700;
        color: var(--life-bar-text);
        min-width: 36px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .bar-frame {
        width: var(--life-bar-width);
        height: var(--life-bar-height);
        border-radius: var(--life-bar-radius);
        background: var(--life-bar-bg);
        border: 1px solid var(--life-bar-frame);
        position: relative;
        overflow: hidden;
        transition: border-color 0.25s ease;
    }

    .fill {
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: var(--life-bar-color);
        transition: width 0.45s cubic-bezier(0.2, 0.75, 0.25, 1), background 0.35s ease;
        position: relative;
        overflow: hidden;
    }

    .shimmer {
        display: none;
    }

    .scanlines {
        display: none;
    }

    :host([low]) .bar-frame {
        border-color: #E94560;
    }

    .bar-frame.hp-hit {
        animation: hp-hit 0.44s ease;
    }

    .bar-frame.hp-heal {
        animation: hp-heal 0.44s ease;
    }

    :host([show-text="false"]) .value {
        display: none;
    }

    @keyframes hp-hit {
        0% { transform: translateY(0); }
        35% { transform: translateY(0.4px); }
        100% { transform: translateY(0); }
    }

    @keyframes hp-heal {
        0% { transform: translateY(0); }
        35% { transform: translateY(-0.4px); }
        100% { transform: translateY(0); }
    }
</style>

<span class="label"></span>
<div class="bar-frame">
    <div class="fill"></div>
    <div class="shimmer"></div>
    <div class="scanlines"></div>
</div>
<span class="value"></span>
`

export default class PlayerLifeBar extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'max', 'label', 'size', 'color', 'glow', 'variant', 'width', 'height', 'show-text']
    }

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true))
        this._prevPct = null
        this._changeFxTimer = null

        this._els = {
            label: this.shadowRoot.querySelector('.label'),
            value: this.shadowRoot.querySelector('.value'),
            fill: this.shadowRoot.querySelector('.fill'),
            frame: this.shadowRoot.querySelector('.bar-frame')
        }
    }

    disconnectedCallback() {
        if (this._changeFxTimer) {
            clearTimeout(this._changeFxTimer)
            this._changeFxTimer = null
        }
    }

    attributeChangedCallback() {
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
            this.style.setProperty('--life-fluid-core', 'rgba(255, 255, 255, 0.85)')
            this.style.setProperty('--life-fluid-edge', 'rgba(255, 255, 255, 0.45)')
            return
        }

        const clamped = Math.max(0, Math.min(100, pct))
        const danger = 1 - (clamped / 100)
        const hue = Math.round((clamped / 100) * 120)
        const glowAlpha = 0.32 + (danger * 0.4)

        this.style.setProperty('--life-bar-color', `hsl(${hue} 88% 52%)`)
        this.style.setProperty('--life-bar-glow', `hsl(${hue} 95% 55% / ${glowAlpha.toFixed(2)})`)
        this.style.setProperty('--life-fluid-core', `hsl(${hue} 92% 70% / 0.92)`)
        this.style.setProperty('--life-fluid-edge', `hsl(${hue} 84% 36% / 0.95)`)
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
        const shimmerDuration = 3.2 - (danger * 2.0)

        this.style.setProperty('--life-pulse-strength', `${pulseStrength.toFixed(2)}`)
        this.style.setProperty('--life-pulse-duration', `${pulseDuration.toFixed(2)}s`)
        this.style.setProperty('--life-shimmer-duration', `${shimmerDuration.toFixed(2)}s`)
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
