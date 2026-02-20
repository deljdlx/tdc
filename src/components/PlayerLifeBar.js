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
        --life-fluid-core: rgba(110, 231, 183, 0.9);
        --life-fluid-edge: rgba(21, 128, 61, 0.95);
        --life-pulse-duration: 2.6s;
        --life-pulse-strength: 0.15;
        --life-shimmer-duration: 3.2s;
        --life-change-boost: 0.2;
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
        border-radius: 999px;
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 50%),
            linear-gradient(180deg, #081124 0%, var(--life-bar-bg) 52%, #060c1a 100%);
        border: 1px solid color-mix(in srgb, var(--life-bar-frame) 72%, #dbeafe 28%);
        box-shadow:
            inset 0 1px 3px rgba(255, 255, 255, 0.12),
            inset 0 -2px 4px rgba(0, 0, 0, 0.55),
            0 0 8px rgba(8, 14, 28, 0.45),
            0 0 calc(6px + 10px * var(--life-pulse-strength)) var(--life-bar-glow);
        animation: glow-pulse var(--life-pulse-duration) ease-in-out infinite;
        position: relative;
        overflow: hidden;
        transition: box-shadow 0.25s ease, border-color 0.25s ease;
    }

    .bar-frame::before {
        content: '';
        position: absolute;
        inset: 2px 12%;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
        opacity: 0.5;
        pointer-events: none;
    }

    .bar-frame::after {
        content: '';
        position: absolute;
        inset: 1px;
        border-radius: 999px;
        border: 1px solid rgba(191, 219, 254, 0.18);
        pointer-events: none;
    }

    .fill {
        height: 100%;
        width: 0;
        border-radius: inherit;
        background:
            linear-gradient(
                90deg,
                color-mix(in srgb, var(--life-fluid-edge) 85%, #0b1120 15%) 0%,
                var(--life-fluid-core) 35%,
                var(--life-bar-color) 65%,
                color-mix(in srgb, var(--life-fluid-edge) 92%, #020617 8%) 100%
            );
        box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.24),
            inset 0 -2px 3px rgba(2, 6, 23, 0.3),
            0 0 8px var(--life-bar-glow);
        transition: width 0.45s cubic-bezier(0.2, 0.75, 0.25, 1), background 0.35s ease;
        position: relative;
        overflow: hidden;
    }

    .fill::before {
        content: '';
        position: absolute;
        inset: 1px 8% auto 8%;
        height: 45%;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
        opacity: 0.75;
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
        animation: sweep var(--life-shimmer-duration) ease-in-out infinite;
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
        border-color: rgba(239, 68, 68, 0.65);
    }

    .bar-frame.hp-hit {
        animation:
            glow-pulse var(--life-pulse-duration) ease-in-out infinite,
            hp-hit 0.44s ease;
    }

    .bar-frame.hp-heal {
        animation:
            glow-pulse var(--life-pulse-duration) ease-in-out infinite,
            hp-heal 0.44s ease;
    }

    :host([show-text="false"]) .value {
        display: none;
    }

    @keyframes sweep {
        0% { transform: translateX(0); }
        50% { transform: translateX(280%); }
        100% { transform: translateX(280%); }
    }

    @keyframes glow-pulse {
        0%, 100% {
            box-shadow:
                inset 0 1px 2px rgba(0, 0, 0, 0.65),
                0 0 8px rgba(8, 14, 28, 0.45),
                0 0 calc(6px + 10px * var(--life-pulse-strength)) var(--life-bar-glow);
        }
        50% {
            box-shadow:
                inset 0 1px 2px rgba(0, 0, 0, 0.65),
                0 0 10px rgba(8, 14, 28, 0.5),
                0 0 calc(10px + 18px * var(--life-pulse-strength)) var(--life-bar-glow);
        }
    }

    @keyframes hp-hit {
        0% { filter: saturate(1); transform: translateY(0); }
        35% { filter: saturate(calc(1 + var(--life-change-boost))); transform: translateY(0.4px); }
        100% { filter: saturate(1); transform: translateY(0); }
    }

    @keyframes hp-heal {
        0% { filter: brightness(1); transform: translateY(0); }
        35% { filter: brightness(calc(1 + var(--life-change-boost))); transform: translateY(-0.4px); }
        100% { filter: brightness(1); transform: translateY(0); }
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
