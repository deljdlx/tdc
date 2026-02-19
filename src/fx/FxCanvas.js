/**
 * FxCanvas — layer canvas transparent superposé au DOM pour les effets visuels.
 *
 * Deux modes :
 *   - parent (défaut) : le canvas couvre l'élément parent (position: absolute)
 *   - fullscreen       : le canvas couvre tout le viewport (position: fixed)
 *
 * pointer-events: none pour laisser passer les clics.
 * Boucle requestAnimationFrame lazy (tourne uniquement quand des effets sont actifs).
 */

export default class FxCanvas {

    /** @type {HTMLCanvasElement} */
    _canvas;

    /** @type {CanvasRenderingContext2D} */
    _ctx;

    /** @type {HTMLElement} Élément parent pour le positionnement */
    _parent;

    /** @type {boolean} Mode viewport entier */
    _fullscreen;

    /** @type {Object[]} Effets actifs en cours d'animation */
    _effects;

    /** @type {number|null} ID du requestAnimationFrame en cours */
    _rafId;

    /** @type {number} Timestamp du dernier frame */
    _lastTime;

    /**
     * @param {HTMLElement} parent     - Élément conteneur
     * @param {Object}      [options]
     * @param {boolean}     [options.fullscreen=false] - Couvrir tout le viewport
     */
    constructor(parent, { fullscreen = false } = {}) {
        this._parent = parent
        this._fullscreen = fullscreen
        this._effects = []
        this._rafId = null
        this._lastTime = 0

        this._canvas = document.createElement('canvas')
        this._canvas.className = 'fx-canvas'
        this._ctx = this._canvas.getContext('2d')

        if (fullscreen) {
            this._canvas.style.position = 'fixed'
            this._canvas.style.top = '0'
            this._canvas.style.left = '0'
        }

        parent.style.position = 'relative'
        parent.appendChild(this._canvas)

        this._resize()
        this._onResize = () => this._resize()
        window.addEventListener('resize', this._onResize)
    }

    /**
     * Ajoute un effet à animer.
     * Un effet doit implémenter :
     *   - update(dt) → boolean (true = encore vivant, false = terminé)
     *   - draw(ctx, canvas)
     *
     * @param {Object} effect
     */
    spawn(effect) {
        this._effects.push(effect)
        this._ensureLoop()
    }

    /**
     * Lance la boucle de rendu si elle ne tourne pas déjà.
     */
    _ensureLoop() {
        if (this._rafId !== null) return

        this._lastTime = performance.now()
        this._rafId = requestAnimationFrame((t) => this._loop(t))
    }

    /**
     * Boucle principale : update + draw de tous les effets actifs.
     *
     * @param {number} time - Timestamp en ms
     */
    _loop(time) {
        const dt = (time - this._lastTime) / 1000 // delta en secondes
        this._lastTime = time

        // Resize si nécessaire (le parent DOM peut changer de taille après render)
        this._resize()

        // Clear
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)

        // Update + draw
        this._effects = this._effects.filter(effect => {
            const alive = effect.update(dt)
            if (alive) {
                effect.draw(this._ctx, this._canvas)
            }
            return alive
        })

        // Continuer la boucle seulement s'il reste des effets
        if (this._effects.length > 0) {
            this._rafId = requestAnimationFrame((t) => this._loop(t))
        } else {
            this._rafId = null
            // Clear final
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
        }
    }

    /**
     * Ajuste la taille du canvas (viewport en fullscreen, parent sinon).
     */
    _resize() {
        const dpr = window.devicePixelRatio || 1

        let w, h
        if (this._fullscreen) {
            w = window.innerWidth
            h = window.innerHeight
        } else {
            const rect = this._parent.getBoundingClientRect()
            w = Math.round(rect.width)
            h = Math.round(rect.height)
        }

        if (this._canvas.width !== w * dpr || this._canvas.height !== h * dpr) {
            this._canvas.width = w * dpr
            this._canvas.height = h * dpr
            this._canvas.style.width = `${w}px`
            this._canvas.style.height = `${h}px`
            this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
    }

    /**
     * Supprime tous les effets et arrête la boucle.
     */
    clear() {
        this._effects = []
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId)
            this._rafId = null
        }
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
    }

    /**
     * Détruit le canvas et libère les ressources.
     */
    destroy() {
        this.clear()
        window.removeEventListener('resize', this._onResize)
        this._canvas.remove()
    }
}
