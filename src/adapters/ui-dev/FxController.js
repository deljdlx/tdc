/**
 * FxController — gère les effets visuels (particules, animations).
 *
 * Interface simple pour déclencher des effets sans connaître les détails.
 */

import ParticleBurst from '../../fx/ParticleBurst.js'
import ShockwaveRing from '../../fx/ShockwaveRing.js'

export default class FxController {
    constructor(fxCanvas) {
        this._canvas = fxCanvas
    }

    /**
     * Retourne le centre viewport d'un élément.
     */
    _centerOf(element) {
        const r = element.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }

    /**
     * Effet d'attaque.
     */
    fxAttack(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ShockwaveRing({
            x, y,
            color: '#e94560',
            maxRadius: 70,
            duration: 0.4,
            rings: 2,
            lineWidth: 4
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#e94560', '#ff7043', '#f0c040', '#ffffff'],
            count: 35,
            speed: 250,
            duration: 0.6,
            size: 6
        }))
    }

    /**
     * Effet de sort.
     */
    fxSpell(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ShockwaveRing({
            x, y,
            color: '#a78bfa',
            maxRadius: 85,
            duration: 0.5,
            rings: 3
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#a78bfa', '#818cf8', '#c084fc', '#ffffff'],
            count: 28,
            speed: 180,
            duration: 0.7,
            size: 5
        }))
    }

    /**
     * Effet de guérison.
     */
    fxHeal(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ShockwaveRing({
            x, y,
            color: '#4ade80',
            maxRadius: 100,
            duration: 0.6,
            rings: 2,
            lineWidth: 2
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#4ade80', '#86efac', '#fbbf24', '#ffffff'],
            count: 22,
            speed: 140,
            duration: 0.8,
            size: 4
        }))
    }
}
