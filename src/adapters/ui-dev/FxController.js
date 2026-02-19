/**
 * FxController — gère les effets visuels (particules, animations).
 *
 * Interface simple pour déclencher des effets sans connaître les détails.
 */

import FxCanvas from '../../fx/FxCanvas.js'
import ParticleBurst from '../../fx/ParticleBurst.js'
import ShockwaveRing from '../../fx/ShockwaveRing.js'
import MouseTrail from '../../fx/MouseTrail.js'

export default class FxController {
    constructor(canvasElement) {
        this.canvas = new FxCanvas(canvasElement)
        this.mouseTrail = new MouseTrail(canvasElement)
        this.subscriptions = []
    }

    /**
     * Démarre l'animation de la souris.
     */
    startMouseTrail(domElement) {
        this.mouseTrail.attach(domElement)
    }

    /**
     * Arrête l'animation de la souris.
     */
    stopMouseTrail() {
        this.mouseTrail.detach()
    }

    /**
     * Effet d'attaque.
     */
    async fxAttack(fromCard, toCard) {
        const fromRect = fromCard?.getBoundingClientRect() ?? { x: 200, y: 200 }
        const toRect = toCard?.getBoundingClientRect() ?? { x: 800, y: 200 }

        const centerFrom = {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2
        }
        const centerTo = {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2
        }

        // Burst from attacker
        this.canvas.add(new ParticleBurst(centerFrom, {
            color: '#ff6b6b',
            angle: Math.atan2(centerTo.y - centerFrom.y, centerTo.x - centerFrom.x),
            count: 12,
            duration: 500
        }))

        // Shockwave at defender
        await this._delay(100)
        this.canvas.add(new ShockwaveRing(centerTo, {
            color: '#ff6b6b',
            duration: 600
        }))
    }

    /**
     * Effet de sort.
     */
    async fxSpell(fromCard, toCard) {
        const fromRect = fromCard?.getBoundingClientRect() ?? { x: 200, y: 200 }
        const toRect = toCard?.getBoundingClientRect() ?? { x: 800, y: 200 }

        const centerFrom = {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2
        }
        const centerTo = {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2
        }

        // Burst from spell source
        this.canvas.add(new ParticleBurst(centerFrom, {
            color: '#4dabf7',
            angle: Math.atan2(centerTo.y - centerFrom.y, centerTo.x - centerFrom.x),
            count: 16,
            duration: 400
        }))

        await this._delay(80)
        this.canvas.add(new ShockwaveRing(centerTo, {
            color: '#4dabf7',
            duration: 500
        }))
    }

    /**
     * Effet de guérison.
     */
    async fxHeal(targetCard) {
        const rect = targetCard?.getBoundingClientRect() ?? { x: 400, y: 300 }
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        }

        this.canvas.add(new ParticleBurst(center, {
            color: '#51cf66',
            angle: Math.PI / 2, // Vers le haut
            count: 8,
            duration: 600
        }))
    }

    /**
     * Effet de mort.
     */
    async fxDeath(targetCard) {
        const rect = targetCard?.getBoundingClientRect() ?? { x: 400, y: 300 }
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        }

        this.canvas.add(new ParticleBurst(center, {
            color: '#868e96',
            count: 20,
            duration: 800
        }))

        await this._delay(200)
        this.canvas.add(new ShockwaveRing(center, {
            color: '#868e96',
            duration: 700
        }))
    }

    /**
     * Subscribe aux événements du moteur.
     */
    subscribeToEngine(eventBus) {
        const subscription = eventBus.subscribe((event) => {
            this._handleEngineEvent(event)
        })
        this.subscriptions.push(subscription)
        return subscription
    }

    /**
     * Traite les événements du moteur.
     */
    _handleEngineEvent(event) {
        // À intégrer avec la logique du jeu
        // Par exemple:
        // if (event.type === 'CreatureAttacked') { ... }
    }

    /**
     * Helper de délai.
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Nettoie les ressources.
     */
    destroy() {
        this.subscriptions.forEach(unsub => unsub?.())
        this.subscriptions = []
        this.canvas?.destroy?.()
        this.mouseTrail?.detach?.()
    }
}
