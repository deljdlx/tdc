/**
 * ParticleBurst — explosion de particules depuis un point.
 *
 * Les particules jaillissent dans toutes les directions,
 * ralentissent, rétrécissent et disparaissent progressivement.
 *
 * Chaque particule a :
 * - position (x, y)
 * - vélocité (vx, vy)
 * - taille, couleur, durée de vie
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
 * Convertit un hex (#rrggbb) en {r, g, b}.
 *
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16)
    return {
        r: (n >> 16) & 255,
        g: (n >> 8) & 255,
        b: n & 255
    }
}

export default class ParticleBurst {

    /** @type {Object[]} */
    _particles;

    /** @type {number} Temps écoulé depuis le spawn */
    _elapsed;

    /** @type {number} Durée max de l'effet (secondes) */
    _duration;

    /**
     * @param {Object} options
     * @param {number} options.x          - Centre X (en px, relatif au canvas)
     * @param {number} options.y          - Centre Y
     * @param {number} [options.count=24] - Nombre de particules
     * @param {string[]} [options.colors] - Palette de couleurs hex
     * @param {number} [options.speed=180]    - Vitesse initiale max
     * @param {number} [options.duration=0.8] - Durée de vie en secondes
     * @param {number} [options.size=5]       - Taille max des particules
     */
    constructor({
        x, y,
        count = 24,
        colors = ['#e94560', '#f0c040', '#ff7043', '#ffffff'],
        speed = 180,
        duration = 0.8,
        size = 5
    }) {
        this._elapsed = 0
        this._duration = duration

        this._particles = Array.from({ length: count }, () => {
            const angle = rand(0, Math.PI * 2)
            const v = rand(speed * 0.3, speed)
            const color = hexToRgb(colors[Math.floor(rand(0, colors.length))])

            return {
                x,
                y,
                vx: Math.cos(angle) * v,
                vy: Math.sin(angle) * v,
                size: rand(size * 0.4, size),
                color,
                life: rand(0.5, 1.0), // durée relative (0-1)
                age: 0
            }
        })
    }

    /**
     * Met à jour les particules.
     *
     * @param {number} dt - Delta time en secondes
     * @returns {boolean} true si l'effet est encore vivant
     */
    update(dt) {
        this._elapsed += dt

        for (const p of this._particles) {
            p.age += dt

            // Déplacement avec friction
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vx *= 0.96
            p.vy *= 0.96

            // Petite gravité
            p.vy += 40 * dt
        }

        return this._elapsed < this._duration
    }

    /**
     * Dessine les particules sur le canvas.
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (const p of this._particles) {
            const progress = p.age / (this._duration * p.life)
            if (progress >= 1) continue

            const alpha = 1 - progress
            const scale = 1 - progress * 0.6
            const radius = p.size * scale

            ctx.beginPath()
            ctx.arc(p.x, p.y, Math.max(0.5, radius), 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`
            ctx.fill()

            // Halo léger
            if (radius > 2) {
                ctx.beginPath()
                ctx.arc(p.x, p.y, radius * 2, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.15})`
                ctx.fill()
            }
        }
    }
}
