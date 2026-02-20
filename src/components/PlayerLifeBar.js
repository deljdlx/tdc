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
        --life-bar-color: #22c55e;
        --life-bar-glow: rgba(34, 197, 94, 0.35);
        --life-bar-bg: #0b1120;
        --life-bar-frame: #1d2945;
        --life-bar-label: #7b8fad;
        --life-bar-text: #e2e8f0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Orbitron', 'Cinzel', sans-serif;
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
        text-shadow: 0 0 6px rgba(15, 23, 42, 0.6);
    }

    .bar-frame {
        width: var(--life-bar-width);
        height: var(--life-bar-height);
        border-radius: 2px;
        background: linear-gradient(180deg, #050a16 0%, var(--life-bar-bg) 55%, #070d1b 100%);
        border: 1px solid var(--life-bar-frame);
        box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.65),
            0 0 8px rgba(8, 14, 28, 0.45);
        position: relative;
        overflow: hidden;
    }

    .bar-frame::after {
        content: '';
        position: absolute;
        inset: 1px;
        border-radius: 1px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        pointer-events: none;
    }

    .fill {
        height: 100%;
        width: 0;
        background: var(--life-bar-color);
        box-shadow: 0 0 8px var(--life-bar-glow);
        transition: width 0.4s ease, background 0.35s ease;
        position: relative;
        overflow: hidden;
    }

    .fill::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 50%);
        mix-blend-mode: screen;
        opacity: 0.7;
    }

    .shimmer {
        position: absolute;
        top: 0;
        left: -30%;
        width: 30%;
        height: 100%;
        background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.12), transparent);
        animation: sweep 3s ease-in-out infinite;
        pointer-events: none;
        opacity: 0.65;
    }

    .scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.06) 0px,
            rgba(255, 255, 255, 0.02) 1px,
            transparent 2px,
            transparent 4px
        );
        opacity: 0.25;
        pointer-events: none;
    }

    :host([variant="arcade"]) .bar-frame {
        clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%, 6px 50%);
    }

    :host([variant="neon"]) .bar-frame {
        border-color: #4cc9f0;
        box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.65),
            0 0 14px rgba(76, 201, 240, 0.4);
    }

    :host([variant="steel"]) .bar-frame {
        border-color: #4b5563;
        background: linear-gradient(180deg, #0e141f 0%, #121b28 55%, #0b111b 100%);
    }

    :host([low]) .bar-frame {
        animation: low-pulse 1.4s ease-in-out infinite;
    }

    :host([show-text="false"]) .value {
        display: none;
    }

    @keyframes sweep {
        0% { transform: translateX(0); }
        50% { transform: translateX(280%); }
        100% { transform: translateX(280%); }
    }

    @keyframes low-pulse {
        0%, 100% { box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.65), 0 0 8px rgba(239, 68, 68, 0.25); }
        50% { box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.65), 0 0 14px rgba(239, 68, 68, 0.55); }
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

        this._els = {
            label: this.shadowRoot.querySelector('.label'),
            value: this.shadowRoot.querySelector('.value'),
            fill: this.shadowRoot.querySelector('.fill'),
            frame: this.shadowRoot.querySelector('.bar-frame')
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

        if (pct > 60) {
            this.style.setProperty('--life-bar-color', '#22c55e')
            this.style.setProperty('--life-bar-glow', 'rgba(34, 197, 94, 0.35)')
        } else if (pct > 30) {
            this.style.setProperty('--life-bar-color', '#f59e0b')
            this.style.setProperty('--life-bar-glow', 'rgba(245, 158, 11, 0.35)')
        } else {
            this.style.setProperty('--life-bar-color', '#ef4444')
            this.style.setProperty('--life-bar-glow', 'rgba(239, 68, 68, 0.45)')
        }
    }

    _syncState(pct) {
        if (pct <= 30 && pct > 0) {
            this.setAttribute('low', '')
        } else {
            this.removeAttribute('low')
        }
    }
}

customElements.define('player-life-bar', PlayerLifeBar)
