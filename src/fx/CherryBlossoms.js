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

    /** @type {number} Temps accumulé pour le vent */
    _windTime

    /** @type {number} Force de vent actuelle (px/s) */
    _windCurrent

    /** @type {number} Force de vent cible (px/s) */
    _windTarget

    /** @type {number} Temps avant prochaine variation de vent */
    _windCooldown

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
        this._windTime = 0
        this._windCurrent = 4
        this._windTarget = 4
        this._windCooldown = 0
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

        this._updateWind(dt)

        // Update tous les pétales existants
        for (let i = this._petals.length - 1; i >= 0; i--) {
            const petal = this._petals[i]
            petal.update(dt, this._windCurrent, this._windTime)

            // Supprimer si sorti du canvas
            const outBottom = petal.y > this._height + 24
            const outSide = petal.x < -80 || petal.x > this._width + 80
            if (outBottom || outSide) {
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
        const margin = 80
        const x = -margin + Math.random() * (this._width + margin * 2)
        const y = -20 - Math.random() * 50 // Spawn au-dessus du canvas

        const petal = new Petal(x, y)
        this._petals.push(petal)
    }

    /**
     * Simule une brise légère avec petites variations et rafales douces.
     * @param {number} dt
     */
    _updateWind(dt) {
        this._windTime += dt
        this._windCooldown -= dt

        if (this._windCooldown <= 0) {
            const calm = 3 + Math.random() * 5
            const gust = Math.random() < 0.28 ? 6 + Math.random() * 8 : 0
            const direction = Math.random() < 0.18 ? -1 : 1
            this._windTarget = direction * (calm + gust)
            this._windCooldown = 1.4 + Math.random() * 2.1
        }

        const response = Math.min(1, dt * 1.25)
        this._windCurrent += (this._windTarget - this._windCurrent) * response
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

        // Profondeur pseudo-3D (0 = loin, 1 = proche)
        this.depth = 0.35 + Math.random() * 0.95

        // Vitesse de chute verticale (px/s), liée à la profondeur
        this.fallSpeed = (14 + Math.random() * 22) * (0.72 + this.depth * 0.62)

        // Oscillation horizontale
        this.swingAmplitude = (8 + Math.random() * 18) * (1.15 - this.depth * 0.25)
        this.swingFrequency = 0.35 + Math.random() * 0.85
        this.swingPhase = Math.random() * Math.PI * 2 // Phase aléatoire

        // Dérive propre du pétale (pour éviter un mouvement trop parfait)
        this.driftSpeed = (Math.random() - 0.5) * 10

        // Rotation
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * (0.35 + Math.random() * 0.75)
        this.tiltPhase = Math.random() * Math.PI * 2
        this.tiltFrequency = 0.9 + Math.random() * 1.6
        this.tiltStrength = 0.35 + Math.random() * 0.55

        // Taille et couleur
        this.size = (2.8 + Math.random() * 4.2) * (0.78 + this.depth * 0.46)
        this.baseColor = this._randomPetalColor()
        this.opacity = 0.26 + this.depth * 0.42

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
            { r: 255, g: 195, b: 209 }, // Rose clair
            { r: 255, g: 206, b: 218 }, // Rose tendre
            { r: 255, g: 228, b: 234 }, // Rose brume
            { r: 255, g: 241, b: 246 }, // Blanc rosé
            { r: 250, g: 244, b: 252 }, // Presque blanc
        ]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    /**
     * Update position et rotation
     * @param {number} dt - Delta time en secondes
     */
    update(dt, wind, windTime) {
        this.time += dt

        // Chute
        this.y += this.fallSpeed * dt

        // Brise globale + oscillation + petite dérive propre
        const breezeWave = Math.sin(windTime * 0.42 + this.swingPhase * 0.6) * 7
        this.baseX += (wind + breezeWave + this.driftSpeed) * dt
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
        const fold = Math.sin(this.time * this.tiltFrequency + this.tiltPhase)
        const xScale = 0.48 + (fold + 1) * 0.34
        const yScale = 0.96 + (1 - Math.abs(fold)) * 0.1
        const alpha = this.opacity * (0.72 + (1 - xScale) * 0.68)

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.scale(xScale, yScale)

        // Ombre douce (profondeur)
        ctx.fillStyle = `rgba(123, 82, 96, ${0.08 + this.depth * 0.09})`
        ctx.beginPath()
        ctx.ellipse(this.size * 0.1, this.size * 0.92, this.size * 0.72, this.size * 0.44, 0, 0, Math.PI * 2)
        ctx.fill()

        // Corps du pétale avec dégradé pour simuler un petit volume.
        const grad = ctx.createLinearGradient(-this.size * 0.9, -this.size, this.size, this.size * 1.2)
        grad.addColorStop(0, `rgba(${this.baseColor.r + 8}, ${this.baseColor.g + 8}, ${this.baseColor.b + 8}, 0.95)`)
        grad.addColorStop(0.55, `rgba(${this.baseColor.r}, ${this.baseColor.g}, ${this.baseColor.b}, 0.92)`)
        grad.addColorStop(1, `rgba(${Math.max(210, this.baseColor.r - 22)}, ${Math.max(170, this.baseColor.g - 28)}, ${Math.max(185, this.baseColor.b - 22)}, 0.9)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(0, 0, this.size, this.size * (1.34 + this.tiltStrength * 0.08), 0, 0, Math.PI * 2)
        ctx.fill()

        // Highlight central subtil (effet 3D)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.beginPath()
        ctx.ellipse(-this.size * 0.18, -this.size * 0.32, this.size * 0.28, this.size * 0.56, 0, 0, Math.PI * 2)
        ctx.fill()

        // Contour léger pour garder la lisibilité
        ctx.strokeStyle = 'rgba(226, 172, 186, 0.26)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        ctx.restore()
    }
}
