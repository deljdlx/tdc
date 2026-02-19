/**
 * GhostAnimator — gère l'animation 3D du ghost pendant le drag.
 *
 * Responsabilités:
 * - Création du ghost 3D (clone, reflet, ombre)
 * - Tilt 3D pendant le drag
 * - Animation de vol vers la cible
 * - Bounce & reveal final
 *
 * Réutilisable par tous les adapters avec DOM.
 */

export default class GhostAnimator {
    /**
     * Crée le ghost 3D complet (carte clonée, reflet, ombre).
     * Retourne { ghost, scene, shine, shadow, cardW, cardH }.
     *
     * @param {HTMLElement} srcCard - Carte source à cloner
     * @param {number} x - Position X du pointeur
     * @param {number} y - Position Y du pointeur
     * @returns {Object}
     */
    createDragGhost(srcCard, x, y) {
        const rect = srcCard.getBoundingClientRect()
        const W = rect.width
        const H = rect.height
        const SCALE = 1.15
        const SW = W * SCALE
        const SH = H * SCALE

        const ghost = document.createElement('div')
        ghost.style.cssText = `
            position: fixed;
            width: ${SW}px;
            height: ${SH}px;
            left: ${x - SW / 2}px;
            top: ${y - SH * 0.6}px;
            pointer-events: none;
            z-index: 10000;
            perspective: 180px;
            transform: scale(1);
            will-change: left, top, transform;
        `

        const scene = document.createElement('div')
        scene.style.cssText = `
            width: ${SW}px;
            height: ${SH}px;
            position: relative;
            transform-style: preserve-3d;
            transform-origin: center center;
            transform: rotateX(-15deg);
            transition: transform 0.06s ease-out;
            will-change: transform;
        `

        const card = document.createElement('tcg-card')
        for (const attr of srcCard.getAttributeNames()) {
            if (['draggable', 'playable', 'can-attack', 'selected', 'class'].includes(attr)) continue
            card.setAttribute(attr, srcCard.getAttribute(attr))
        }
        card.style.cssText = `
            --card-width: ${SW}px;
            perspective: none;
            display: block;
            position: absolute;
            top: 0; left: 0;
        `

        const shine = document.createElement('div')
        shine.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: ${SW}px;
            height: ${SH}px;
            border-radius: 8px;
            transform: translateZ(1px);
            pointer-events: none;
            background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 50%);
            will-change: background;
        `

        scene.appendChild(card)
        scene.appendChild(shine)

        const shadow = document.createElement('div')
        shadow.style.cssText = `
            position: absolute;
            left: 5%; right: 5%;
            bottom: -20px;
            height: 28px;
            background: rgba(0, 0, 0, 0.55);
            border-radius: 50%;
            filter: blur(16px);
            will-change: transform, opacity;
        `

        ghost.appendChild(scene)
        ghost.appendChild(shadow)
        document.body.appendChild(ghost)

        return { ghost, scene, shine, shadow, cardW: SW, cardH: SH }
    }

    /**
     * Met à jour le tilt 3D, le reflet et l'ombre d'un ghost en mouvement.
     *
     * @param {Object} ghostState - {ghostScene, ghostShine, ghostShadow, tiltX, tiltY}
     * @param {number} dx - Delta X depuis dernier mouvement
     * @param {number} dy - Delta Y depuis dernier mouvement
     */
    updateGhostTilt(ghostState, dx, dy) {
        const targetTiltY = Math.max(-50, Math.min(50, dx * 6))
        const targetTiltX = Math.max(-35, Math.min(35, -dy * 4))
        ghostState.tiltX += (targetTiltX - ghostState.tiltX) * 0.4
        ghostState.tiltY += (targetTiltY - ghostState.tiltY) * 0.4

        const tx = ghostState.tiltX
        const ty = ghostState.tiltY

        ghostState.ghostScene.style.transform =
            `rotateY(${ty.toFixed(1)}deg) rotateX(${tx.toFixed(1)}deg)`

        if (ghostState.ghostShine) {
            const sx = 50 + ty * 2
            const sy = 50 + tx * 2
            ghostState.ghostShine.style.background =
                `radial-gradient(ellipse at ${sx.toFixed(0)}% ${sy.toFixed(0)}%, rgba(255,255,255,0.25) 0%, transparent 50%)`
        }

        if (ghostState.ghostShadow) {
            ghostState.ghostShadow.style.transform =
                `translateX(${(-ty * 0.8).toFixed(0)}px) scaleX(${(1 + Math.abs(ty) * 0.02).toFixed(2)})`
            ghostState.ghostShadow.style.opacity =
                `${Math.max(0.15, 0.5 - Math.abs(tx) * 0.008).toFixed(2)}`
        }
    }

    /**
     * Anime le ghost vers la cible.
     *
     * @param {HTMLElement} ghost
     * @param {HTMLElement} scene
     * @param {HTMLElement} shine
     * @param {HTMLElement} shadow
     * @param {DOMRect} targetRect - Rectangle de la cible
     */
    animateFlying(ghost, scene, shine, shadow, targetRect) {
        const ease = '0.25s cubic-bezier(0.2,0,0.2,1)'

        const currentRect = ghost.getBoundingClientRect()
        const currentW = currentRect.width
        const currentH = currentRect.height

        const scaleW = targetRect.width / currentW
        const scaleH = targetRect.height / currentH
        const scale = Math.max(scaleW, scaleH)

        const currentCenterX = currentRect.left + currentW / 2
        const currentCenterY = currentRect.top + currentH / 2
        const targetCenterX = targetRect.left + targetRect.width / 2
        const targetCenterY = targetRect.top + targetRect.height / 2

        const offsetX = targetCenterX - currentCenterX
        const offsetY = targetCenterY - currentCenterY

        ghost.style.transition = ['left', 'top', 'transform', 'perspective']
            .map(p => `${p} ${ease}`).join(', ')

        ghost.style.left = `${currentRect.left + offsetX}px`
        ghost.style.top = `${currentRect.top + offsetY}px`
        ghost.style.transform = `scale(${scale})`
        ghost.style.perspective = '9999px'

        scene.style.transition = `transform ${ease}`
        scene.style.transform = 'rotateX(0deg) rotateY(0deg)'

        shine.style.transition = 'opacity 0.2s'
        shine.style.opacity = '0'
        shadow.style.transition = 'opacity 0.2s'
        shadow.style.opacity = '0'
    }

    /**
     * Rebond + reveal final.
     *
     * @param {HTMLElement} ghost
     * @param {HTMLElement} boardCard
     * @returns {Promise<void>}
     */
    animateBounceAndReveal(ghost, boardCard) {
        return new Promise((resolve) => {
            ghost.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'

            requestAnimationFrame(() => {
                ghost.style.transform = 'scale(1.15)'

                setTimeout(() => {
                    ghost.style.transition =
                        'transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.15s ease-out'
                    ghost.style.transform = 'scale(1)'
                    ghost.style.opacity = '0'

                    boardCard.style.transition = 'opacity 0.15s ease-in'
                    boardCard.style.opacity = '1'

                    setTimeout(() => {
                        if (ghost.parentNode) ghost.remove()
                        boardCard.style.transition = ''
                        boardCard.style.opacity = ''
                        resolve()
                    }, 220)
                }, 150)
            })
        })
    }

    /**
     * Animation de drop invalide.
     *
     * @param {HTMLElement} ghost
     * @param {HTMLElement} scene
     * @returns {Promise<void>}
     */
    animateInvalidDrop(ghost, scene) {
        return new Promise((resolve) => {
            if (!ghost || !scene) {
                resolve()
                return
            }
            scene.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in'
            scene.style.transform = 'rotateX(50deg) scale(0.7)'
            scene.style.opacity = '0'
            setTimeout(() => {
                ghost.remove()
                resolve()
            }, 310)
        })
    }
}
