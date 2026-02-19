/**
 * SparkTrail — projectile d'étincelles voyageant d'un point A à un point B.
 *
 * Un noyau lumineux se déplace en ligne courbe (arc paramétrable)
 * et sème des étincelles derrière lui. En arrivant à destination,
 * une petite gerbe finale se déclenche.
 * Utile pour les attaques à distance et les projectiles de sorts.
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
 * Ease-in-out quadratique.
 *
 * @param {number} t
 * @returns {number}
 */
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}

/** @type {number} Hauteur max de l'arc en px */
const ARC_HEIGHT = 40

/** @type {number} Nombre d'étincelles semées par frame */
const SPARKS_PER_FRAME = 3

export default class SparkTrail {

    /** @type {Object[]} Étincelles laissées derrière le projectile */
    _sparks

    /** @type {number} */
    _elapsed

    /** @type {number} */
    _duration

    /** @type {{r: number, g: number, b: number}} */
    _color

    /** @type {number} */
    _x0

    /** @type {number} */
    _y0

    /** @type {number} */
    _x1

    /** @type {number} */
    _y1

    /** @type {number} Position courante du noyau */
    _headX

    /** @type {number} */
    _headY

    /** @type {boolean} Le projectile a-t-il atteint sa cible */
    _arrived

    /**
     * @param {Object}  options
     * @param {number}  options.x0             - Départ X
     * @param {number}  options.y0             - Départ Y
     * @param {number}  options.x1             - Arrivée X
     * @param {number}  options.y1             - Arrivée Y
     * @param {string}  [options.color='#f59e0b'] - Couleur hex
     * @param {number}  [options.duration=0.45]   - Durée du trajet
     * @param {number}  [options.sparkLife=0.3]    - Durée de vie des étincelles
     */
    constructor({
        x0, y0, x1, y1,
        color = '#f59e0b',
        duration = 0.45,
        sparkLife = 0.3
    }) {
        this._x0 = x0
        this._y0 = y0
        this._x1 = x1
        this._y1 = y1
        this._headX = x0
        this._headY = y0
        this._color = hexToRgb(color)
        this._elapsed = 0
        this._duration = duration
        this._sparkLife = sparkLife
        this._arrived = false
        this._sparks = []
    }

    /**
     * @param {number} dt
     * @returns {boolean}
     */
    update(dt) {
        this._elapsed += dt
        const travelT = Math.min(this._elapsed / this._duration, 1)

        if (!this._arrived) {
            const eased = easeInOut(travelT)
            this._headX = this._x0 + (this._x1 - this._x0) * eased
            // Arc parabolique : y = lerp + parabole
            const baseY = this._y0 + (this._y1 - this._y0) * eased
            this._headY = baseY - ARC_HEIGHT * Math.sin(eased * Math.PI)

            // Semer des étincelles
            for (let i = 0; i < SPARKS_PER_FRAME; i++) {
                this._sparks.push({
                    x: this._headX + rand(-3, 3),
                    y: this._headY + rand(-3, 3),
                    vx: rand(-30, 30),
                    vy: rand(-20, 40),
                    age: 0,
                    life: rand(this._sparkLife * 0.5, this._sparkLife),
                    size: rand(1, 2.8)
                })
            }

            if (travelT >= 1) {
                this._arrived = true
                this._spawnImpact()
            }
        }

        // Mise à jour des étincelles
        for (const s of this._sparks) {
            s.age += dt
            s.x += s.vx * dt
            s.y += s.vy * dt
            s.vy += 60 * dt
            s.vx *= 0.95
        }

        // Encore vivant tant que des étincelles subsistent
        const hasLiveSparks = this._sparks.some(s => s.age < s.life)
        return !this._arrived || hasLiveSparks
    }

    /**
     * Gerbe de particules à l'impact.
     */
    _spawnImpact() {
        const IMPACT_COUNT = 12
        for (let i = 0; i < IMPACT_COUNT; i++) {
            const angle = rand(0, Math.PI * 2)
            const speed = rand(40, 120)
            this._sparks.push({
                x: this._x1,
                y: this._y1,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                age: 0,
                life: rand(0.2, 0.45),
                size: rand(1.5, 3.5)
            })
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const { r, g, b } = this._color

        // Étincelles
        for (const s of this._sparks) {
            const t = s.age / s.life
            if (t >= 1) continue

            const alpha = 1 - t
            const radius = Math.max(0.3, s.size * (1 - t * 0.6))

            ctx.beginPath()
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
            ctx.fill()
        }

        // Noyau du projectile (tant qu'il n'est pas arrivé)
        if (!this._arrived) {
            const coreRadius = 4
            // Halo
            ctx.beginPath()
            ctx.arc(this._headX, this._headY, coreRadius * 3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.18)`
            ctx.fill()

            // Noyau blanc
            ctx.beginPath()
            ctx.arc(this._headX, this._headY, coreRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, 0.9)`
            ctx.fill()

            // Anneau coloré
            ctx.beginPath()
            ctx.arc(this._headX, this._headY, coreRadius * 1.6, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
            ctx.lineWidth = 1.5
            ctx.stroke()
        }
    }
}
