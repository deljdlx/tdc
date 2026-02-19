/**
 * DragDropManager — gère le drag & drop complet (souris + touch + hit detection).
 *
 * Abstraits les complexités de gérer souris ET touch avec même logic.
 * Délègue les actions (accept/drop) aux callbacks fournis.
 *
 * Responsabilités:
 * - Détection souris/touch
 * - Seuil de démarrage (100px de mouvement)
 * - Hit detection
 * - Mise en surbrillance des cibles
 * - Callbacks pour drop accept/reject
 *
 * Réutilisable par tous les adapters avec DOM.
 */

import GhostAnimator from './GhostAnimator.js'

export default class DragDropManager {
    /**
     * @param {Object} options
     * @param {HTMLElement} [options.root=document.body] - Racine pour les listeners
     */
    constructor(options = {}) {
        this._root = options.root || document.body
        this._ghostAnimator = new GhostAnimator()

        // État du drag
        this._inputState = null      // {source, el, dragInfo, startX, startY, active}
        this._dragState = null
        this._dropTargets = []

        // Bindings
        this._onMouseMove = this._handleDragMove.bind(this, 'mouse')
        this._onMouseUp = this._handleDragEnd.bind(this, 'mouse')
        this._onTouchMove = this._handleDragMove.bind(this, 'touch')
        this._onTouchEnd = this._handleDragEnd.bind(this, 'touch')

        // Listeners callbacks
        this._onDragStart = null
        this._onDragMove = null
        this._onDragEnd = null
    }

    /**
     * Initialise les listeners globaux.
     */
    init() {
        document.addEventListener('mousemove', this._onMouseMove)
        document.addEventListener('mouseup', this._onMouseUp)
        document.addEventListener('touchmove', this._onTouchMove, { passive: false })
        document.addEventListener('touchend', this._onTouchEnd)
    }

    /**
     * Nettoie les listeners.
     */
    destroy() {
        document.removeEventListener('mousemove', this._onMouseMove)
        document.removeEventListener('mouseup', this._onMouseUp)
        document.removeEventListener('touchmove', this._onTouchMove)
        document.removeEventListener('touchend', this._onTouchEnd)
    }

    /**
     * Rend un élément draggable.
     *
     * @param {HTMLElement} el
     * @param {Object} dragInfo - Données attachées au drag
     */
    makeDraggable(el, dragInfo) {
        el.style.cursor = 'grab'

        el.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return
            e.preventDefault()
            this._startDrag(e.clientX, e.clientY, 'mouse', el, dragInfo)
        })

        el.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return
            const touch = e.touches[0]
            this._startDrag(touch.clientX, touch.clientY, 'touch', el, dragInfo)
        }, { passive: true })
    }

    /**
     * Enregistre un drop target.
     *
     * @param {HTMLElement} el
     * @param {string} highlightAttr - Attribut à ajouter quand accepte
     * @param {Function} acceptFn - (dragInfo) => boolean
     * @param {Function} dropFn - (dragInfo, targetEl) => void
     */
    registerDropTarget(el, highlightAttr, acceptFn, dropFn) {
        this._dropTargets.push({ el, highlightAttr, acceptFn, dropFn })
    }

    /**
     * Réinitialise les drop targets.
     */
    resetDropTargets() {
        this._dropTargets = []
    }

    /**
     * Définit les callbacks de drag.
     *
     * @param {Object} callbacks
     * @param {Function} [callbacks.onDragStart] - (dragInfo, ghostData) => void
     * @param {Function} [callbacks.onDragMove] - (x, y) => void
     * @param {Function} [callbacks.onDragEnd] - (targetEl, accepted) => void
     */
    setCallbacks(callbacks) {
        this._onDragStart = callbacks.onDragStart
        this._onDragMove = callbacks.onDragMove
        this._onDragEnd = callbacks.onDragEnd
    }

    // =====================
    // PRIVATE
    // =====================

    /**
     * Démarre un drag potentiel.
     */
    _startDrag(x, y, source, el, dragInfo) {
        if (this._inputState) return

        this._inputState = {
            source,
            el,
            dragInfo,
            startX: x,
            startY: y,
            active: false
        }
    }

    /**
     * Gère le mouvement du drag.
     */
    _handleDragMove(source, x, y) {
        const s = this._inputState
        if (!s || s.source !== source) return

        if (!s.active) {
            const dx = x - s.startX
            const dy = y - s.startY
            if (dx * dx + dy * dy < 100) return
            this._activateDrag(s, x, y)
        }

        if (this._onDragMove) {
            this._onDragMove(x, y)
        }

        this._updateDropHighlight(x, y)

        if (s.ghost) {
            s.ghost.style.left = `${x - s.ghostW / 2}px`
            s.ghost.style.top = `${y - s.ghostH * 0.6}px`

            const dx = x - s.prevX
            const dy = y - s.prevY

            if (s.ghostState) {
                this._ghostAnimator.updateGhostTilt(s.ghostState, dx, dy)
            }

            s.prevX = x
            s.prevY = y
        }
    }

    /**
     * Active le drag réel (crée le ghost).
     */
    _activateDrag(s, x, y) {
        s.active = true
        this._dragState = s.dragInfo
        s.el.classList.add('dragging')
        s.prevX = x
        s.prevY = y

        // Créer le ghost et récupérer son state
        const ghostData = this._ghostAnimator.createDragGhost(s.el, x, y)
        Object.assign(s, ghostData, {
            ghostState: {
                ghostScene: ghostData.scene,
                ghostShine: ghostData.shine,
                ghostShadow: ghostData.shadow,
                tiltX: 0,
                tiltY: 0
            },
            ghostW: ghostData.cardW,
            ghostH: ghostData.cardH
        })

        // Afficher les drop hints
        this._showDropHints()

        if (this._onDragStart) {
            this._onDragStart(s.dragInfo, ghostData)
        }
    }

    /**
     * Termine le drag.
     */
    _handleDragEnd(source, x, y) {
        const s = this._inputState
        if (!s || s.source !== source) return

        if (s.active) {
            const target = this._findDropTarget(x, y)
            s.el.classList.remove('dragging')
            this._clearDropHints()

            if (target && this._dragState && target.acceptFn(this._dragState)) {
                // Drop accepté
                target.dropFn(this._dragState, target.el)

                if (s.ghost && this._onDragEnd) {
                    this._onDragEnd(target.el, true)
                }
            } else {
                // Drop rejeté
                if (s.ghost) {
                    this._ghostAnimator.animateInvalidDrop(s.ghost, s.ghostState?.ghostScene)
                }

                if (this._onDragEnd) {
                    this._onDragEnd(null, false)
                }
            }

            this._dragState = null
        }

        this._inputState = null
    }

    /**
     * Affiche les drop hints sur les cibles valides.
     */
    _showDropHints() {
        for (const { el, acceptFn } of this._dropTargets) {
            if (this._dragState && acceptFn(this._dragState)) {
                el.setAttribute('drop-hint', '')
            }
        }
    }

    /**
     * Retire les drop hints.
     */
    _clearDropHints() {
        for (const { el } of this._dropTargets) {
            el.removeAttribute('drop-hint')
            el.removeAttribute('drop-active')
            el.removeAttribute('drop-target')
        }
    }

    /**
     * Met en surbrillance la cible sous les coords.
     */
    _updateDropHighlight(x, y) {
        for (const dt of this._dropTargets) {
            dt.el.removeAttribute(dt.highlightAttr)
        }
        const target = this._findDropTarget(x, y)
        if (target) {
            target.el.setAttribute(target.highlightAttr, '')
        }
    }

    /**
     * Trouve la cible de drop aux coords.
     */
    _findDropTarget(x, y) {
        for (let i = this._dropTargets.length - 1; i >= 0; i--) {
            const dt = this._dropTargets[i]
            const rect = dt.el.getBoundingClientRect()
            if (x >= rect.left && x <= rect.right &&
                y >= rect.top && y <= rect.bottom &&
                this._dragState && dt.acceptFn(this._dragState)) {
                return dt
            }
        }
        return null
    }
}
