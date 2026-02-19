/**
 * ParticleVortex — particules aspirées en spirale vers un point central.
 *
 * Les particules apparaissent à distance du centre et spiralent
 * vers lui en accélérant, créant un effet d'aspiration/absorption.
 * Utile pour les effets de pioche, drain de mana, ou absorption.
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

export default class ParticleVortex {

    /** @type {Object[]} */
    _particles

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
     * @param {number}   options.x              - Centre X (point d'attraction)
     * @param {number}   options.y              - Centre Y
     * @param {number}   [options.count=30]     - Nombre de particules
     * @param {string[]} [options.colors]       - Palette hex
     * @param {number}   [options.radius=90]    - Rayon initial de spawn
     * @param {number}   [options.duration=0.9] - Durée de l'effet
     * @param {number}   [options.size=3.5]     - Taille max des particules
     */
    constructor({
        x, y,
        count = 30,
        colors = ['#38bdf8', '#818cf8', '#e0f2fe', '#ffffff'],
        radius = 90,
        duration = 0.9,
        size = 3.5
    }) {
        this._x = x
        this._y = y
        this._elapsed = 0
        this._duration = duration

        this._particles = Array.from({ length: count }, () => {
            const angle = rand(0, Math.PI * 2)
            const dist = rand(radius * 0.5, radius)
            const color = hexToRgb(colors[Math.floor(rand(0, colors.length))])

            return {
                angle,
                dist,
                angularSpeed: rand(4, 9) * (Math.random() > 0.5 ? 1 : -1),
                shrinkSpeed: rand(0.6, 1.0),
                size: rand(size * 0.5, size),
                color,
                delay: rand(0, duration * 0.3)
            }
        })
    }

    /**
     * @param {number} dt
     * @returns {boolean}
     */
    update(dt) {
        this._elapsed += dt

        for (const p of this._particles) {
            if (this._elapsed < p.delay) continue

            p.angle += p.angularSpeed * dt
            // Accélération vers le centre
            p.dist -= p.dist * p.shrinkSpeed * dt * 2.5
            p.angularSpeed *= 1.02
        }

        return this._elapsed < this._duration
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const globalProgress = Math.min(this._elapsed / this._duration, 1)

        for (const p of this._particles) {
            if (this._elapsed < p.delay) continue

            const localT = (this._elapsed - p.delay) / (this._duration - p.delay)
            if (localT >= 1) continue

            const x = this._x + Math.cos(p.angle) * p.dist
            const y = this._y + Math.sin(p.angle) * p.dist
            const alpha = Math.min(1, localT * 3) * (1 - localT)
            const radius = Math.max(0.3, p.size * (1 - localT * 0.5))

            // Traînée lumineuse
            ctx.beginPath()
            ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.1})`
            ctx.fill()

            // Particule principale
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`
            ctx.fill()
        }

        // Lueur centrale qui s'intensifie
        if (globalProgress > 0.2) {
            const coreAlpha = Math.min(1, (globalProgress - 0.2) * 2) * (1 - globalProgress)
            const coreRadius = 8 + globalProgress * 14

            ctx.beginPath()
            ctx.arc(this._x, this._y, coreRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha * 0.25})`
            ctx.fill()
        }
    }
}
