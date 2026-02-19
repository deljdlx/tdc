/**
 * ArcaneOrbitBurst — orbes arcanes en spirale avec dissipation.
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

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

export default class ArcaneOrbitBurst {

    /** @type {Object[]} */
    _orbs

    /** @type {number} */
    _elapsed

    /** @type {number} */
    _duration

    /** @type {number} */
    _x

    /** @type {number} */
    _y

    /**
     * @param {Object} options
     * @param {number} options.x
     * @param {number} options.y
     * @param {number} [options.count=18]
     * @param {number} [options.duration=0.75]
     * @param {string[]} [options.colors]
     */
    constructor({
        x,
        y,
        count = 18,
        duration = 0.75,
        colors = ['#7c3aed', '#a78bfa', '#22d3ee', '#f8fafc']
    }) {
        this._x = x
        this._y = y
        this._elapsed = 0
        this._duration = duration

        this._orbs = Array.from({ length: count }, () => {
            const color = hexToRgb(colors[Math.floor(rand(0, colors.length))])
            const angle = rand(0, Math.PI * 2)
            return {
                angle,
                angularSpeed: rand(7, 13) * (Math.random() > 0.5 ? 1 : -1),
                radius: rand(6, 20),
                radialSpeed: rand(24, 60),
                size: rand(1.8, 3.8),
                color
            }
        })
    }

    /**
     * @param {number} dt
     * @returns {boolean}
     */
    update(dt) {
        this._elapsed += dt

        for (const orb of this._orbs) {
            orb.angle += orb.angularSpeed * dt
            orb.radius += orb.radialSpeed * dt
            orb.radialSpeed *= 0.97
        }

        return this._elapsed < this._duration
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const progress = clamp(this._elapsed / this._duration, 0, 1)
        const alpha = 1 - progress

        for (const orb of this._orbs) {
            const x = this._x + Math.cos(orb.angle) * orb.radius
            const y = this._y + Math.sin(orb.angle) * orb.radius
            const radius = Math.max(0.3, orb.size * (1 - progress * 0.6))
            const trailRadius = radius * (2.4 + progress)

            ctx.beginPath()
            ctx.arc(x, y, trailRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, ${alpha * 0.12})`
            ctx.fill()

            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, ${alpha})`
            ctx.fill()
        }

        const coreRadius = 10 + progress * 22
        ctx.beginPath()
        ctx.arc(this._x, this._y, coreRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.16})`
        ctx.fill()
    }
}
