/**
 * CherryBlossoms — effet de fond animé de pétales de cerisiers tombant doucement.
 *
 * Crée des pétales roses/blancs qui tombent en oscillant avec un mouvement naturel.
 * Effet passif et discret, ajuste automatiquement la densité selon la taille du canvas.
 */

export default class CherryBlossoms {

    /** @type {Petal[]} Liste des pétales actifs */
    _petals

    /** @type {number} Largeur du canvas */
    _width

    /** @type {number} Hauteur du canvas */
    _height

    /** @type {number} Compteur pour spawn progressif */
    _spawnTimer

    /** @type {number} Densité cible (pétales par 10000px²) */
    _targetDensity

    /**
     * @param {Object} [options]
     * @param {number} [options.density=0.3] - Densité (pétales par 10000px²)
     */
    constructor({ density = 0.3 } = {}) {
        this._petals = []
        this._width = 0
        this._height = 0
        this._spawnTimer = 1.0 // Démarre à 1.0 pour forcer spawn immédiat
        this._targetDensity = density
    }

    /**
     * Update : fait tomber les pétales et spawn de nouveaux au besoin
     * @param {number} dt - Delta time en secondes
     * @param {HTMLCanvasElement} [canvas] - Canvas (optionnel, pour récupérer dimensions)
     * @returns {boolean} true (effet permanent)
     */
    update(dt, canvas) {
        // Mettre à jour les dimensions du canvas si fourni
        if (canvas && (this._width !== canvas.width || this._height !== canvas.height)) {
            this._width = canvas.width
            this._height = canvas.height
        }

        // Update tous les pétales existants
        for (let i = this._petals.length - 1; i >= 0; i--) {
            const petal = this._petals[i]
            petal.update(dt)

            // Supprimer si sorti du canvas
            if (petal.y > this._height + 20) {
                this._petals.splice(i, 1)
            }
        }

        // Spawn progressif pour atteindre la densité cible
        this._spawnTimer += dt
        if (this._spawnTimer > 0.2) { // Check toutes les 0.2s
            this._spawnTimer = 0
            this._maintainDensity()
        }

        return true // Effet permanent
    }

    /**
     * Draw : dessine tous les pétales
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     */
    draw(ctx, canvas) {
        // Mettre à jour les dimensions si changées
        if (this._width !== canvas.width || this._height !== canvas.height) {
            this._width = canvas.width
            this._height = canvas.height
        }

        for (const petal of this._petals) {
            petal.draw(ctx)
        }
    }

    /**
     * Spawn de nouveaux pétales si en dessous de la densité cible
     */
    _maintainDensity() {
        if (this._width === 0 || this._height === 0) return

        const area = (this._width * this._height) / 10000 // En unités de 10000px²
        const targetCount = Math.floor(area * this._targetDensity)
        const deficit = targetCount - this._petals.length

        if (deficit > 0) {
            // Spawn 1-3 pétales par cycle
            const toSpawn = Math.min(deficit, Math.ceil(Math.random() * 3))
            for (let i = 0; i < toSpawn; i++) {
                this._spawnPetal()
            }
        }
    }

    /**
     * Crée un nouveau pétale en haut du canvas (ou juste au-dessus)
     */
    _spawnPetal() {
        const x = Math.random() * this._width
        const y = -20 - Math.random() * 50 // Spawn au-dessus du canvas

        const petal = new Petal(x, y)
        this._petals.push(petal)
    }
}

/**
 * Petal — un pétale individuel
 */
class Petal {
    /**
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     */
    constructor(x, y) {
        this.x = x
        this.y = y

        // Vitesse de chute verticale (px/s)
        this.fallSpeed = 20 + Math.random() * 30 // 20-50 px/s

        // Oscillation horizontale
        this.swingAmplitude = 15 + Math.random() * 25 // 15-40 px d'amplitude
        this.swingFrequency = 0.8 + Math.random() * 1.2 // 0.8-2 Hz
        this.swingPhase = Math.random() * Math.PI * 2 // Phase aléatoire

        // Rotation
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 2 // -1 à +1 rad/s

        // Taille et couleur
        this.size = 3 + Math.random() * 4 // 3-7 px
        this.color = this._randomPetalColor()
        this.opacity = 0.4 + Math.random() * 0.4 // 0.4-0.8

        // Position de base pour oscillation
        this.baseX = x
        this.time = 0
    }

    /**
     * Retourne une couleur de pétale (rose/blanc/rose pâle)
     * @returns {string}
     */
    _randomPetalColor() {
        const colors = [
            'rgba(255, 182, 193, 1)', // Light pink
            'rgba(255, 192, 203, 1)', // Pink
            'rgba(255, 228, 225, 1)', // Misty rose
            'rgba(255, 240, 245, 1)', // Lavender blush
            'rgba(255, 255, 255, 1)', // White
        ]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    /**
     * Update position et rotation
     * @param {number} dt - Delta time en secondes
     */
    update(dt) {
        this.time += dt

        // Chute
        this.y += this.fallSpeed * dt

        // Oscillation sinusoïdale
        const swingOffset = Math.sin(this.time * this.swingFrequency * Math.PI * 2 + this.swingPhase) * this.swingAmplitude
        this.x = this.baseX + swingOffset

        // Rotation
        this.rotation += this.rotationSpeed * dt
    }

    /**
     * Dessine le pétale
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        // Forme de pétale simple (ellipse)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.ellipse(0, 0, this.size, this.size * 1.5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Contour subtil
        ctx.strokeStyle = 'rgba(255, 192, 203, 0.3)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        ctx.restore()
    }
}
