/**
 * FxController — gère les effets visuels (particules, animations).
 *
 * Interface simple pour déclencher des effets sans connaître les détails.
 */

import ParticleBurst from '../../fx/ParticleBurst.js'
import ShockwaveRing from '../../fx/ShockwaveRing.js'
import ArcaneOrbitBurst from '../../fx/ArcaneOrbitBurst.js'
import ParticleVortex from '../../fx/ParticleVortex.js'
import SparkTrail from '../../fx/SparkTrail.js'
import EmberRise from '../../fx/EmberRise.js'

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

    /**
     * Effet d'invocation de créature.
     */
    fxSummon(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ArcaneOrbitBurst({
            x, y,
            count: 20,
            duration: 0.8
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#7c3aed', '#a78bfa', '#22d3ee', '#ffffff'],
            count: 18,
            speed: 120,
            duration: 0.5,
            size: 3.4
        }))
    }

    /**
     * Effet de pioche / absorption (vortex aspirant).
     */
    fxDraw(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ParticleVortex({
            x, y,
            colors: ['#38bdf8', '#818cf8', '#e0f2fe', '#ffffff'],
            count: 28,
            radius: 80,
            duration: 0.8
        }))
    }

    /**
     * Effet de projectile d'un élément source vers un élément cible.
     */
    fxProjectile(source, target) {
        const src = this._centerOf(source)
        const dst = this._centerOf(target)
        this._canvas.spawn(new SparkTrail({
            x0: src.x, y0: src.y,
            x1: dst.x, y1: dst.y,
            color: '#f59e0b',
            duration: 0.4,
            sparkLife: 0.25
        }))
    }

    /**
     * Effet de défense (bouclier bleu/argent).
     */
    fxDefend(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ShockwaveRing({
            x, y,
            color: '#60a5fa',
            maxRadius: 80,
            duration: 0.5,
            rings: 2,
            lineWidth: 3
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#60a5fa', '#93c5fd', '#c0c0c0', '#ffffff'],
            count: 20,
            speed: 100,
            duration: 0.6,
            size: 4
        }))
    }

    /**
     * Effet d'activation de pouvoir (doré).
     */
    fxPower(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new ArcaneOrbitBurst({
            x, y,
            count: 16,
            duration: 0.6
        }))
        this._canvas.spawn(new ParticleBurst({
            x, y,
            colors: ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff'],
            count: 24,
            speed: 160,
            duration: 0.5,
            size: 4
        }))
    }

    /**
     * Animation de lunge : l'attaquant se deplace vers la cible puis revient.
     * Declenche fxAttack + fxImpact a l'impact.
     */
    async fxLunge(attacker, target) {
        const src = this._centerOf(attacker)
        const dst = this._centerOf(target)
        const dx = (dst.x - src.x) * 0.6
        const dy = (dst.y - src.y) * 0.6

        const saved = {
            transition: attacker.style.transition,
            transform: attacker.style.transform,
            zIndex: attacker.style.zIndex
        }

        attacker.style.zIndex = '50'

        // Forward lunge
        attacker.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.8, 1)'
        attacker.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`
        await new Promise(r => setTimeout(r, 180))

        // Impact FX (particules + shake/flash en parallele)
        this.fxAttack(target)
        const impactDone = this.fxImpact(target)

        // Return attacker (en parallele avec impact sur la cible)
        attacker.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)'
        attacker.style.transform = 'translate(0, 0) scale(1)'
        await Promise.all([impactDone, new Promise(r => setTimeout(r, 250))])

        // Cleanup
        attacker.style.transition = saved.transition
        attacker.style.transform = saved.transform
        attacker.style.zIndex = saved.zIndex
    }

    /**
     * Tremblement + flash de couleur sur la cible a l'impact.
     */
    async fxImpact(target) {
        const saved = {
            transition: target.style.transition,
            transform: target.style.transform,
            filter: target.style.filter
        }

        target.style.transition = 'none'
        const frames = 10
        const interval = 35

        for (let i = 0; i < frames; i++) {
            const progress = i / frames
            const amplitude = 4 * (1 - progress)
            const ox = (Math.random() * 2 - 1) * amplitude
            const oy = (Math.random() * 2 - 1) * amplitude
            const brightness = 1 + 0.8 * (1 - progress)
            const saturate = 1 + 1.0 * (1 - progress)

            target.style.transform = `translate(${ox}px, ${oy}px)`
            target.style.filter = `brightness(${brightness}) saturate(${saturate})`
            await new Promise(r => setTimeout(r, interval))
        }

        // Cleanup
        target.style.transition = saved.transition
        target.style.transform = saved.transform
        target.style.filter = saved.filter
    }

    /**
     * Effet de brûlure / feu sur une cible.
     */
    fxBurn(target) {
        const { x, y } = this._centerOf(target)
        this._canvas.spawn(new EmberRise({
            x, y,
            count: 22,
            spread: 25,
            riseSpeed: 65,
            duration: 1.0
        }))
        this._canvas.spawn(new ShockwaveRing({
            x, y,
            color: '#ef4444',
            maxRadius: 50,
            duration: 0.35,
            rings: 1,
            lineWidth: 2
        }))
    }
}
