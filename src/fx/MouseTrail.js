/**
 * MouseTrail — traînée de particules qui suit la souris.
 *
 * Chaque appel à addPoint(x, y) ajoute un point qui vieillit
 * et disparaît progressivement. Les points sont reliés par un
 * ruban lissé et ornés de halos lumineux.
 *
 * L'effet s'auto-termine quand tous les points ont expiré ;
 * il suffit de le re-spawner via FxCanvas au prochain mouvement.
 *
 * @example
 *   const trail = new MouseTrail(MouseTrail.PRESETS.NEON)
 *   fxCanvas.spawn(trail)
 *   // sur mousemove :
 *   trail.addPoint(x, y)
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
 * Interpolation linéaire entre deux couleurs RGB.
 */
function lerpColor(a, b, t) {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t)
    }
}

export default class MouseTrail {

    /**
     * Presets prêts à l'emploi.
     *
     * Usage : new MouseTrail(MouseTrail.PRESETS.FIRE)
     */
    static PRESETS = {
        FIRE: {
            colors: ['#ff4500', '#ff6a00', '#f0c040', '#fff176'],
            maxSize: 7,
            minSize: 1,
            lifetime: 0.45,
            glow: true,
            glowRadius: 3,
            glowAlpha: 0.25,
            ribbon: true,
            ribbonWidth: 3
        },
        MAGIC: {
            colors: ['#a78bfa', '#818cf8', '#22d3ee', '#c084fc'],
            maxSize: 6,
            minSize: 1,
            lifetime: 0.55,
            glow: true,
            glowRadius: 3,
            glowAlpha: 0.2,
            ribbon: true,
            ribbonWidth: 2
        },
        NEON: {
            colors: ['#e94560', '#f0c040', '#4ade80', '#22d3ee'],
            maxSize: 4,
            minSize: 0.5,
            lifetime: 0.4,
            glow: true,
            glowRadius: 4,
            glowAlpha: 0.3,
            ribbon: false
        },
        SUBTLE: {
            colors: ['#ffffff', '#c0c0c0', '#8888aa'],
            maxSize: 3,
            minSize: 0.5,
            lifetime: 0.3,
            glow: false,
            ribbon: true,
            ribbonWidth: 1
        },
        ICE: {
            colors: ['#dbeafe', '#93c5fd', '#38bdf8', '#0ea5e9'],
            maxSize: 5,
            minSize: 0.8,
            lifetime: 0.5,
            glow: true,
            glowRadius: 3.2,
            glowAlpha: 0.2,
            ribbon: true,
            ribbonWidth: 2
        },
        POISON: {
            colors: ['#84cc16', '#22c55e', '#16a34a', '#14532d'],
            maxSize: 5,
            minSize: 0.8,
            lifetime: 0.55,
            glow: true,
            glowRadius: 3,
            glowAlpha: 0.22,
            ribbon: true,
            ribbonWidth: 2
        },
        ELECTRIC: {
            colors: ['#fef08a', '#fde047', '#facc15', '#38bdf8'],
            maxSize: 4.5,
            minSize: 0.6,
            lifetime: 0.35,
            glow: true,
            glowRadius: 4.2,
            glowAlpha: 0.34,
            ribbon: false
        },
        BLOOD: {
            colors: ['#7f1d1d', '#b91c1c', '#ef4444', '#fecaca'],
            maxSize: 6,
            minSize: 0.8,
            lifetime: 0.48,
            glow: true,
            glowRadius: 2.7,
            glowAlpha: 0.2,
            ribbon: true,
            ribbonWidth: 2.5
        },
        SHADOW: {
            colors: ['#0f172a', '#1e293b', '#334155', '#64748b'],
            maxSize: 5,
            minSize: 0.7,
            lifetime: 0.52,
            glow: true,
            glowRadius: 2.2,
            glowAlpha: 0.15,
            ribbon: true,
            ribbonWidth: 2
        }
    }

    /**
     * Collections thématiques de presets.
     */
    static COLLECTIONS = Object.freeze({
        SHOWCASE: ['MAGIC', 'FIRE', 'ICE', 'ELECTRIC', 'POISON', 'NEON', 'BLOOD', 'SHADOW'],
        ELEMENTAL: ['FIRE', 'ICE', 'ELECTRIC', 'POISON'],
        ARENA: ['MAGIC', 'BLOOD', 'SHADOW', 'FIRE'],
        MINIMAL: ['SUBTLE', 'NEON']
    })

    /**
     * Retourne tous les noms de presets disponibles.
     *
     * @returns {string[]}
     */
    static listPresetNames() {
        return Object.keys(MouseTrail.PRESETS)
    }

    /**
     * Résout un preset par nom.
     *
     * @param {string} name
     * @returns {Object}
     */
    static getPreset(name) {
        const preset = MouseTrail.PRESETS[name]
        if (!preset) {
            throw new Error(`Unknown MouseTrail preset "${name}"`)
        }
        return { ...preset, colors: [...preset.colors] }
    }

    /** @type {Object[]} Points du trail avec position et âge */
    _points

    /**
     * @param {Object|string}   [options]
     * @param {number}   [options.maxPoints=60]    - Nombre max de points conservés
     * @param {number}   [options.lifetime=0.5]    - Durée de vie d'un point (secondes)
     * @param {string[]} [options.colors]          - Palette hex (cyclée le long du trail)
     * @param {number}   [options.minSize=1]       - Rayon min (fin de vie)
     * @param {number}   [options.maxSize=5]       - Rayon max (près du curseur)
     * @param {boolean}  [options.glow=true]       - Activer le halo lumineux
     * @param {number}   [options.glowRadius=2.5]  - Multiplicateur rayon du halo
     * @param {number}   [options.glowAlpha=0.15]  - Opacité du halo
     * @param {boolean}  [options.ribbon=true]      - Relier les points par une ligne lissée
     * @param {number}   [options.ribbonWidth=2]   - Épaisseur max du ruban
     */
    constructor(options = {}) {
        const resolvedOptions = MouseTrail._resolveOptions(options)
        const {
            maxPoints = 60,
            lifetime = 0.5,
            colors = ['#e94560', '#f0c040', '#a78bfa', '#22d3ee'],
            minSize = 1,
            maxSize = 5,
            glow = true,
            glowRadius = 2.5,
            glowAlpha = 0.15,
            ribbon = true,
            ribbonWidth = 2
        } = resolvedOptions

        this._maxPoints = maxPoints
        this._lifetime = lifetime
        this._colors = colors.map(hexToRgb)
        this._minSize = minSize
        this._maxSize = maxSize
        this._glow = glow
        this._glowRadius = glowRadius
        this._glowAlpha = glowAlpha
        this._ribbon = ribbon
        this._ribbonWidth = ribbonWidth
        this._points = []
    }

    /**
     * @param {Object|string} options
     * @returns {Object}
     */
    static _resolveOptions(options) {
        if (typeof options === 'string') {
            return MouseTrail.getPreset(options)
        }
        if (options?.preset) {
            const preset = MouseTrail.getPreset(options.preset)
            return { ...preset, ...options, preset: undefined }
        }
        return options ?? {}
    }

    /**
     * Ajoute un point au trail.
     *
     * @param {number} x - Coordonnée X (relative au canvas)
     * @param {number} y - Coordonnée Y
     */
    addPoint(x, y) {
        this._points.push({ x, y, age: 0 })
        if (this._points.length > this._maxPoints) {
            this._points.shift()
        }
    }

    /**
     * @returns {boolean} true si l'effet a encore des points visibles
     */
    isAlive() {
        return this._points.length > 0
    }

    /**
     * @param {number} dt - Delta time en secondes
     * @returns {boolean} true si l'effet est encore vivant
     */
    update(dt) {
        for (const p of this._points) {
            p.age += dt
        }
        this._points = this._points.filter(p => p.age < this._lifetime)
        return this._points.length > 0
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const len = this._points.length
        if (len === 0) return

        // Pass 1 : ruban lissé reliant les points
        if (this._ribbon && len >= 2) {
            this._drawRibbon(ctx)
        }

        // Pass 2 : particules individuelles avec halo
        for (let i = 0; i < len; i++) {
            this._drawPoint(ctx, i)
        }
    }

    // ---- private ----

    /**
     * Couleur interpolée pour un point à la position `i` sur `len` points.
     */
    _colorAt(i, len, alpha) {
        const t = len > 1 ? i / (len - 1) : 0
        const scaled = t * (this._colors.length - 1)
        const idx = Math.floor(scaled)
        const frac = scaled - idx
        const c1 = this._colors[Math.min(idx, this._colors.length - 1)]
        const c2 = this._colors[Math.min(idx + 1, this._colors.length - 1)]
        const c = lerpColor(c1, c2, frac)
        return { ...c, a: alpha }
    }

    /**
     * Progress (0 = vient de naître, 1 = mort) pour un point.
     */
    _progress(point) {
        return Math.min(point.age / this._lifetime, 1)
    }

    /**
     * Dessine le ruban lissé en quadratic curves.
     */
    _drawRibbon(ctx) {
        const pts = this._points
        const len = pts.length

        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)

        for (let i = 1; i < len - 1; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2
            const my = (pts[i].y + pts[i + 1].y) / 2
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
        }

        // Dernier segment droit vers le point le plus récent
        ctx.lineTo(pts[len - 1].x, pts[len - 1].y)

        // Gradient le long du stroke : du plus vieux (transparent) au plus récent (opaque)
        const oldest = pts[0]
        const newest = pts[len - 1]
        const grad = ctx.createLinearGradient(oldest.x, oldest.y, newest.x, newest.y)

        const cOld = this._colorAt(0, len, 0)
        const cNew = this._colorAt(len - 1, len, 1 - this._progress(newest))
        grad.addColorStop(0, `rgba(${cOld.r},${cOld.g},${cOld.b},0)`)
        grad.addColorStop(1, `rgba(${cNew.r},${cNew.g},${cNew.b},${cNew.a * 0.6})`)

        ctx.strokeStyle = grad
        ctx.lineWidth = this._ribbonWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
    }

    /**
     * Dessine un point individuel (particule + halo optionnel).
     */
    _drawPoint(ctx, i) {
        const p = this._points[i]
        const len = this._points.length
        const progress = this._progress(p)
        const alpha = 1 - progress
        const size = this._maxSize - (this._maxSize - this._minSize) * progress
        const color = this._colorAt(i, len, alpha)

        // Halo
        if (this._glow && size > 0.8) {
            const gr = size * this._glowRadius
            const gradient = ctx.createRadialGradient(p.x, p.y, size * 0.3, p.x, p.y, gr)
            gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha * this._glowAlpha})`)
            gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
            ctx.beginPath()
            ctx.arc(p.x, p.y, gr, 0, Math.PI * 2)
            ctx.fillStyle = gradient
            ctx.fill()
        }

        // Particule centrale
        if (size > 0.3) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, Math.max(0.3, size), 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`
            ctx.fill()
        }
    }
}
