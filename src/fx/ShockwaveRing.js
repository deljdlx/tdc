/**
 * ShockwaveRing — onde de choc circulaire qui s'expand et s'estompe.
 *
 * Un anneau lumineux s'étend rapidement depuis un point central,
 * avec un halo interne plus diffus. L'expansion suit un easing
 * "ease-out" pour un rendu naturel (rapide puis ralenti).
 *
 * @example
 *   fxCanvas.spawn(new ShockwaveRing({ x: 100, y: 200, color: '#4ade80' }))
 */

/**
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Ease-out cubic : accélération initiale, décélération en fin.
 */
function easeOut(t) {
    const t1 = 1 - t
    return 1 - t1 * t1 * t1
}

export default class ShockwaveRing {

    /**
     * @param {Object}  options
     * @param {number}  options.x              - Centre X
     * @param {number}  options.y              - Centre Y
     * @param {string}  [options.color='#ffffff']   - Couleur hex de l'anneau
     * @param {number}  [options.maxRadius=80]      - Rayon final
     * @param {number}  [options.duration=0.5]      - Durée en secondes
     * @param {number}  [options.lineWidth=3]       - Épaisseur initiale de l'anneau
     * @param {number}  [options.rings=2]           - Nombre d'anneaux concentriques
     */
    constructor({
        x, y,
        color = '#ffffff',
        maxRadius = 80,
        duration = 0.5,
        lineWidth = 3,
        rings = 2
    }) {
        this._x = x
        this._y = y
        this._color = hexToRgb(color)
        this._maxRadius = maxRadius
        this._duration = duration
        this._lineWidth = lineWidth
        this._rings = rings
        this._elapsed = 0
    }

    /**
     * @param {number} dt
     * @returns {boolean}
     */
    update(dt) {
        this._elapsed += dt
        return this._elapsed < this._duration
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const { r, g, b } = this._color

        for (let i = 0; i < this._rings; i++) {
            const delay = i * 0.08
            const t = Math.max(0, (this._elapsed - delay) / (this._duration - delay))
            if (t <= 0 || t >= 1) continue

            const progress = easeOut(t)
            const alpha = (1 - t) * (1 - i * 0.3)
            const radius = Math.max(0, this._maxRadius * progress * (1 - i * 0.2))
            const lw = Math.max(0.1, this._lineWidth * (1 - t * 0.6) * (1 + i * 0.5))

            if (radius < 0.5) continue

            // Halo diffus
            ctx.beginPath()
            ctx.arc(this._x, this._y, radius, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.2})`
            ctx.lineWidth = lw * 4
            ctx.stroke()

            // Anneau principal
            ctx.beginPath()
            ctx.arc(this._x, this._y, radius, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.lineWidth = lw
            ctx.stroke()
        }

        // Flash central au tout début
        if (this._elapsed < this._duration * 0.3) {
            const flashT = this._elapsed / (this._duration * 0.3)
            const flashAlpha = 1 - flashT
            const flashRadius = Math.max(0.5, this._maxRadius * 0.15 * easeOut(flashT))
            ctx.beginPath()
            ctx.arc(this._x, this._y, flashRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r},${g},${b},${flashAlpha * 0.4})`
            ctx.fill()
        }
    }
}
