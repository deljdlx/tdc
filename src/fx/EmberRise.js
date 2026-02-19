/**
 * EmberRise — braises et flammèches qui s'élèvent en ondulant.
 *
 * Les particules naissent autour d'un point et montent lentement
 * en oscillant latéralement, simulant des braises portées par l'air chaud.
 * Utile pour les effets de brûlure, dégâts de feu, ou embrasement.
 */

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function rand(min, max) {
    return min + Math.random() * (max - min)
}

/**
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export default class EmberRise {

    /** @type {Object[]} */
    _embers

    /** @type {number} */
    _elapsed

    /** @type {number} */
    _duration

    /** @type {number} */
    _x

    /** @type {number} */
    _y

    /**
     * @param {Object}   options
     * @param {number}   options.x               - Centre X de la source
     * @param {number}   options.y               - Centre Y de la source
     * @param {number}   [options.count=25]      - Nombre de braises
     * @param {string[]} [options.colors]        - Palette hex (chaud → froid)
     * @param {number}   [options.spread=30]     - Dispersion horizontale
     * @param {number}   [options.riseSpeed=70]  - Vitesse ascendante
     * @param {number}   [options.duration=1.2]  - Durée totale
     * @param {number}   [options.size=3]        - Taille max
     */
    constructor({
        x, y,
        count = 25,
        colors = ['#ef4444', '#f97316', '#facc15', '#fef3c7'],
        spread = 30,
        riseSpeed = 70,
        duration = 1.2,
        size = 3
    }) {
        this._x = x
        this._y = y
        this._elapsed = 0
        this._duration = duration

        this._embers = Array.from({ length: count }, () => {
            const color = hexToRgb(colors[Math.floor(rand(0, colors.length))])

            return {
                x: x + rand(-spread, spread),
                y: y + rand(-8, 8),
                vy: -rand(riseSpeed * 0.4, riseSpeed),
                // Oscillation latérale
                wobbleAmp: rand(8, 22),
                wobbleFreq: rand(3, 7),
                wobblePhase: rand(0, Math.PI * 2),
                size: rand(size * 0.4, size),
                color,
                delay: rand(0, duration * 0.35),
                life: rand(0.5, 1.0)
            }
        })
    }

    /**
     * @param {number} dt
     * @returns {boolean}
     */
    update(dt) {
        this._elapsed += dt

        for (const e of this._embers) {
            if (this._elapsed < e.delay) continue
            e.y += e.vy * dt
            // Décélération progressive
            e.vy *= 0.993
        }

        return this._elapsed < this._duration
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (const e of this._embers) {
            if (this._elapsed < e.delay) continue

            const localT = (this._elapsed - e.delay) / (this._duration * e.life)
            if (localT >= 1) continue

            // Fade-in rapide, fade-out lent
            const alpha = localT < 0.15
                ? localT / 0.15
                : 1 - (localT - 0.15) / 0.85

            const wobbleX = Math.sin(
                this._elapsed * e.wobbleFreq + e.wobblePhase
            ) * e.wobbleAmp * Math.min(1, localT * 3)

            const drawX = e.x + wobbleX
            const radius = Math.max(0.3, e.size * (1 - localT * 0.4))

            // Lueur diffuse
            ctx.beginPath()
            ctx.arc(drawX, e.y, radius * 3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${e.color.r}, ${e.color.g}, ${e.color.b}, ${alpha * 0.08})`
            ctx.fill()

            // Braise
            ctx.beginPath()
            ctx.arc(drawX, e.y, radius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${e.color.r}, ${e.color.g}, ${e.color.b}, ${alpha})`
            ctx.fill()
        }

        // Lueur de base au sol pendant le premier tiers
        if (this._elapsed < this._duration * 0.4) {
            const baseAlpha = 1 - this._elapsed / (this._duration * 0.4)
            ctx.beginPath()
            ctx.arc(this._x, this._y, 18, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(239, 68, 68, ${baseAlpha * 0.12})`
            ctx.fill()
        }
    }
}
