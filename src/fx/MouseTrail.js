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
 * Les presets peuvent être chargés depuis un fichier JSON via
 * loadPresetsFromJSON(data). Le format attendu est celui de
 * trail-presets.json (clés "presets" et "collections").
 *
 * @example
 *   const trail = new MouseTrail(MouseTrail.PRESETS.NEON)
 *   fxCanvas.spawn(trail)
 *   // sur mousemove :
 *   trail.addPoint(x, y)
 */

import defaultConfig from './trail-presets.json' with { type: 'json' }

const PRESET_REQUIRED_FIELDS = ['colors']
const VALID_SHAPES = ['circle', 'square', 'star', 'diamond', 'triangle']

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

/**
 * Trace un chemin de forme sur le contexte canvas (sans fill/stroke).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shape
 * @param {number} x
 * @param {number} y
 * @param {number} size - Rayon ou demi-côté selon la forme
 */
function tracePath(ctx, shape, x, y, size) {
    switch (shape) {
        case 'square':
            ctx.rect(x - size, y - size, size * 2, size * 2)
            break
        case 'diamond':
            ctx.moveTo(x, y - size)
            ctx.lineTo(x + size, y)
            ctx.lineTo(x, y + size)
            ctx.lineTo(x - size, y)
            ctx.closePath()
            break
        case 'triangle': {
            const h = size * 0.866
            ctx.moveTo(x, y - size)
            ctx.lineTo(x + h, y + size * 0.5)
            ctx.lineTo(x - h, y + size * 0.5)
            ctx.closePath()
            break
        }
        case 'star': {
            const inner = size * 0.4
            const step = Math.PI / 5
            ctx.moveTo(x, y - size)
            for (let i = 1; i < 10; i++) {
                const r = i % 2 === 0 ? size : inner
                const angle = -Math.PI / 2 + step * i
                ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
            }
            ctx.closePath()
            break
        }
        default:
            ctx.arc(x, y, size, 0, Math.PI * 2)
    }
}

/**
 * Valide qu'un objet preset contient les champs requis.
 *
 * @param {string} name
 * @param {Object} preset
 * @returns {string[]} Liste d'erreurs (vide si valide)
 */
function validatePreset(name, preset) {
    const errors = []
    for (const field of PRESET_REQUIRED_FIELDS) {
        if (!(field in preset)) {
            errors.push(`Preset "${name}": missing required field "${field}"`)
        }
    }
    if (preset.colors && !Array.isArray(preset.colors)) {
        errors.push(`Preset "${name}": "colors" must be an array`)
    }
    if (preset.shape && !VALID_SHAPES.includes(preset.shape)) {
        errors.push(`Preset "${name}": "shape" must be one of ${VALID_SHAPES.join(', ')}`)
    }
    return errors
}

export default class MouseTrail {

    /**
     * Presets prêts à l'emploi (chargés depuis trail-presets.json).
     *
     * Usage : new MouseTrail(MouseTrail.PRESETS.FIRE)
     */
    static PRESETS = { ...defaultConfig.presets }

    /**
     * Collections thématiques de presets.
     */
    static COLLECTIONS = { ...defaultConfig.collections }

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

    /**
     * Charge des presets et collections depuis un objet JSON.
     * Les presets existants sont complétés (merge), pas remplacés.
     *
     * @param {{ presets?: Object, collections?: Object }} data
     * @returns {{ added: string[], errors: string[] }}
     */
    static loadPresetsFromJSON(data) {
        const added = []
        const errors = []

        if (data.presets) {
            for (const [name, preset] of Object.entries(data.presets)) {
                const errs = validatePreset(name, preset)
                if (errs.length > 0) {
                    errors.push(...errs)
                    continue
                }
                MouseTrail.PRESETS[name] = preset
                added.push(name)
            }
        }

        if (data.collections) {
            for (const [name, list] of Object.entries(data.collections)) {
                if (!Array.isArray(list)) {
                    errors.push(`Collection "${name}": value must be an array`)
                    continue
                }
                MouseTrail.COLLECTIONS[name] = list
            }
        }

        return { added, errors }
    }

    /**
     * Exporte les presets et collections actuels en objet JSON-sérialisable.
     *
     * @returns {{ presets: Object, collections: Object }}
     */
    static exportPresets() {
        const presets = {}
        for (const [name, preset] of Object.entries(MouseTrail.PRESETS)) {
            presets[name] = { ...preset, colors: [...preset.colors] }
        }
        return { presets, collections: { ...MouseTrail.COLLECTIONS } }
    }

    /**
     * Réinitialise les presets aux valeurs par défaut (trail-presets.json).
     */
    static resetPresets() {
        MouseTrail.PRESETS = { ...defaultConfig.presets }
        MouseTrail.COLLECTIONS = { ...defaultConfig.collections }
    }

    /** @type {Object[]} Points du trail avec position et âge */
    _points

    /** @type {Object[]} Particules décoratives éphémères */
    _sparkles

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
     * @param {number}   [options.sparklesPerPoint=2] - Nombre de sparkles émis par point
     * @param {number}   [options.sparkleLifetime=0.32] - Durée de vie d'un sparkle (secondes)
     * @param {number}   [options.sparkleSpeed=55]  - Vitesse max des sparkles
     * @param {number}   [options.sparkleSize=1.6]  - Taille de base des sparkles
     * @param {string}   [options.shape='circle']  - Forme des particules (circle, square, star, diamond, triangle)
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
            ribbonWidth = 2,
            sparklesPerPoint = 2,
            sparkleLifetime = 0.32,
            sparkleSpeed = 55,
            sparkleSize = 1.6,
            shape = 'circle'
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
        this._sparklesPerPoint = sparklesPerPoint
        this._sparkleLifetime = sparkleLifetime
        this._sparkleSpeed = sparkleSpeed
        this._sparkleSize = sparkleSize
        this._shape = shape
        this._points = []
        this._sparkles = []
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
        this._emitSparkles(x, y)
        if (this._points.length > this._maxPoints) {
            this._points.shift()
        }
    }

    /**
     * @returns {boolean} true si l'effet a encore des points visibles
     */
    isAlive() {
        return this._points.length > 0 || this._sparkles.length > 0
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

        for (const sparkle of this._sparkles) {
            sparkle.age += dt
            sparkle.x += sparkle.vx * dt
            sparkle.y += sparkle.vy * dt
            sparkle.vx *= 0.93
            sparkle.vy *= 0.93
        }
        this._sparkles = this._sparkles.filter(sparkle => sparkle.age < sparkle.life)

        return this._points.length > 0 || this._sparkles.length > 0
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const len = this._points.length
        if (len === 0 && this._sparkles.length === 0) return

        // Pass 1 : ruban lissé reliant les points
        if (this._ribbon && len >= 2) {
            this._drawRibbon(ctx)
        }

        // Pass 2 : micro-particules décoratives
        this._drawSparkles(ctx)

        // Pass 3 : particules individuelles avec halo
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

    _emitSparkles(x, y) {
        if (this._sparklesPerPoint <= 0) return

        for (let i = 0; i < this._sparklesPerPoint; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = this._sparkleSpeed * (0.35 + Math.random() * 0.65)
            const baseColor = this._colors[Math.floor(Math.random() * this._colors.length)]

            this._sparkles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: this._sparkleLifetime * (0.7 + Math.random() * 0.6),
                age: 0,
                size: this._sparkleSize * (0.7 + Math.random() * 0.8),
                phase: Math.random() * Math.PI * 2,
                color: baseColor
            })
        }
    }

    _drawSparkles(ctx) {
        if (this._sparkles.length === 0) return

        for (const sparkle of this._sparkles) {
            const progress = sparkle.age / sparkle.life
            if (progress >= 1) continue

            const fade = 1 - progress
            const twinkle = 0.65 + Math.sin(sparkle.age * 28 + sparkle.phase) * 0.35
            const alpha = fade * fade * twinkle
            const radius = Math.max(0.25, sparkle.size * (0.5 + fade * 0.8))
            const { r, g, b } = sparkle.color

            ctx.beginPath()
            tracePath(ctx, this._shape, sparkle.x, sparkle.y, radius)
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.fill()

            if (radius > 0.5) {
                const arm = radius * 2.1
                ctx.beginPath()
                ctx.moveTo(sparkle.x - arm, sparkle.y)
                ctx.lineTo(sparkle.x + arm, sparkle.y)
                ctx.moveTo(sparkle.x, sparkle.y - arm)
                ctx.lineTo(sparkle.x, sparkle.y + arm)
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.55})`
                ctx.lineWidth = 0.8
                ctx.stroke()
            }
        }
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
            tracePath(ctx, this._shape, p.x, p.y, Math.max(0.3, size))
            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`
            ctx.fill()
        }
    }
}
