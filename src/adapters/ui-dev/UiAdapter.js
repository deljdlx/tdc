/**
 * UiAdapter — interface dev pour le scénario TCG.
 *
 * Architecture modulaire :
 * - UiState       : gestion centralisée de l'état d'interaction
 * - DragDropManager : handler unifié pour mouse + touch drag/drop
 * - GhostAnimator : animations 3D du ghost et landing
 * - CommandDispatcher : abstraction des commandes moteur
 * - FxController  : gestion des effets visuels
 *
 * Interactions par drag & drop :
 * - Glisser une créature de la main → board pour la jouer
 * - Glisser un sort → cible (créature ou joueur)
 * - Glisser un attaquant → cible ennemie
 *
 * Les cibles valides s'illuminent pendant le drag.
 */

import { startGame, createGame } from '../../gameplay/setup.js'
import PlayCreatureCommand from '../../gameplay/commands/PlayCreatureCommand.js'
import PlaySpellCommand from '../../gameplay/commands/PlaySpellCommand.js'
import AttackCommand from '../../gameplay/commands/AttackCommand.js'
import EndTurnCommand from '../../gameplay/commands/EndTurnCommand.js'
import { getCardDefinition, CardType } from '../../gameplay/definitions/cards.js'
import FxCanvas from '../../fx/FxCanvas.js'
import ParticleBurst from '../../fx/ParticleBurst.js'
import ShockwaveRing from '../../fx/ShockwaveRing.js'
import MouseTrail from '../../fx/MouseTrail.js'
import UiState from '../../services/UiState.js'
import CommandDispatcher from '../../services/CommandDispatcher.js'
import GhostAnimator from '../../services/GhostAnimator.js'
import '../../components/TcgCard.js'
import '../../components/CardZone.js'
import '../../components/PlayerHud.js'

/**
 * Descriptions lisibles des effets de sorts.
 */
const EFFECT_TEXT = {
    DEAL_DAMAGE: (v) => `Deal ${v} damage`,
    RESTORE_HP: (v) => `Restore ${v} HP`
}

/**
 * Palettes de couleurs par contexte d'effet.
 */
const FX_COLORS = {
    attack: ['#e94560', '#ff7043', '#f0c040', '#ffffff'],
    spell: ['#a78bfa', '#818cf8', '#c084fc', '#ffffff'],
    heal: ['#4ade80', '#86efac', '#fbbf24', '#ffffff'],
    death: ['#6b7280', '#9ca3af', '#e94560', '#4b5563']
}

export default class UiAdapter {

    /** @type {import('../../core/engine/Engine.js').default} */
    _engine;

    /** @type {HTMLElement} */
    _root;

    /** @type {FxCanvas} */
    _fx;

    /** @type {Object[]} */
    _eventLog;

    /** @type {Object|null} Infos sur la carte en cours de drag */
    _dragState;

    /** @type {Object[]} Drop targets enregistrés pour le render courant */
    _dropTargets;

    /** @type {MouseTrail|null} */
    _mouseTrail;

    /** @type {Object|null} État du drag souris ou tactile (pré-seuil + actif) */
    _inputState;

    /** @type {string} Panel actif ('game' | 'log') */
    _activePanel;

    /** @type {string|null} ID de la carte venant d'atterrir sur le board */
    _landingCardId;

    constructor(rootElement) {
        this._root = rootElement
        this._eventLog = []
        this._engine = null
        this._fx = new FxCanvas(rootElement, { fullscreen: true })
        this._mouseTrail = null
        this._dragState = null
        this._dropTargets = []
        this._inputState = null
        this._activePanel = 'game'
        this._landingCardId = null

        document.addEventListener('mousemove', (e) => {
            if (!this._mouseTrail || !this._mouseTrail.isAlive()) {
                this._mouseTrail = new MouseTrail(MouseTrail.PRESETS.MAGIC)
                this._fx.spawn(this._mouseTrail)
            }
            this._mouseTrail.addPoint(e.clientX, e.clientY)
            this._handleDragMove(e.clientX, e.clientY, 'mouse')
        })
        document.addEventListener('mouseup', (e) => this._handleDragEnd(e.clientX, e.clientY, 'mouse'))

        document.addEventListener('touchmove', (e) => {
            if (!this._inputState || this._inputState.source !== 'touch') return
            const touch = e.touches[0]
            if (!this._inputState.active) {
                const dx = touch.clientX - this._inputState.startX
                const dy = touch.clientY - this._inputState.startY
                if (dx * dx + dy * dy < 100) return
            }
            e.preventDefault()
            this._handleDragMove(touch.clientX, touch.clientY, 'touch')
        }, { passive: false })
        document.addEventListener('touchend', (e) => {
            if (!this._inputState || this._inputState.source !== 'touch') return
            const touch = e.changedTouches[0]
            this._handleDragEnd(touch.clientX, touch.clientY, 'touch')
        })
        document.addEventListener('touchcancel', () => {
            if (!this._inputState || this._inputState.source !== 'touch') return
            this._handleDragEnd(0, 0, 'touch')
        })
    }

    /**
     * Lance une nouvelle partie et initialise l'UI.
     */
    start() {
        const seed = Math.floor(Math.random() * 100000)
        this._engine = startGame({ seed })
        this._eventLog = [{ text: `Game started (seed: ${seed})` }]
        this._dragState = null
        this._fx.clear()

        this._engine.domainEventBus.on(batch => {
            for (const event of batch) {
                this._eventLog.push({ text: `${event.type}: ${JSON.stringify(event.payload)}` })
            }
            if (this._eventLog.length > 50) {
                this._eventLog = this._eventLog.slice(-50)
            }
        })

        this.render()
    }

    /**
     * Rend l'intégralité de l'UI avec navigation par panels.
     */
    render() {
        if (!this._engine) return

        this._dropTargets = []
        this._dragState = null

        const state = this._engine.state
        const activePlayer = state.turnState.activePlayerId
        const playerIds = Object.keys(state.players)
        const isGameOver = state.turnState.phase === 'game_over'

        // Préserver le canvas FX
        const fxCanvas = this._root.querySelector('.fx-canvas')
        this._root.innerHTML = ''
        if (fxCanvas) this._root.appendChild(fxCanvas)

        // ---- Panel Game ----
        const gamePanel = this._el('div', `panel${this._activePanel === 'game' ? ' active' : ''}`)

        if (isGameOver) {
            const banner = this._el('div', 'game-over-banner')
            const gameOverEvent = this._eventLog.findLast(e => e.text.startsWith('GAME_OVER'))
            banner.textContent = gameOverEvent ? gameOverEvent.text : 'Game Over!'
            gamePanel.appendChild(banner)
        }

        gamePanel.appendChild(this._renderControls(activePlayer, isGameOver))
        gamePanel.appendChild(this._renderStatusBar(state))

        const board = this._el('div', 'game-board')
        board.appendChild(this._renderPlayerArea(state, playerIds[1], activePlayer, true))
        board.appendChild(this._renderPlayerArea(state, playerIds[0], activePlayer, false))
        gamePanel.appendChild(board)
        this._root.appendChild(gamePanel)

        // ---- Panel Log ----
        const logPanel = this._el('div', `panel${this._activePanel === 'log' ? ' active' : ''}`)
        logPanel.appendChild(this._renderEventLog())
        this._root.appendChild(logPanel)

        // ---- Tab Bar ----
        this._root.appendChild(this._renderTabBar())
    }

    // =====================
    // FX HELPERS
    // =====================

    /**
     * Retourne le centre viewport d'un élément.
     */
    _centerOf(element) {
        const r = element.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }

    /**
     * FX : attaque (onde rouge + burst violent).
     */
    _fxAttack(target) {
        const { x, y } = this._centerOf(target)
        this._fx.spawn(new ShockwaveRing({ x, y, color: '#e94560', maxRadius: 70, duration: 0.4, rings: 2, lineWidth: 4 }))
        this._fx.spawn(new ParticleBurst({ x, y, colors: FX_COLORS.attack, count: 35, speed: 250, duration: 0.6, size: 6 }))
    }

    /**
     * FX : sort offensif (onde violette + burst arcane).
     */
    _fxSpell(target) {
        const { x, y } = this._centerOf(target)
        this._fx.spawn(new ShockwaveRing({ x, y, color: '#a78bfa', maxRadius: 85, duration: 0.5, rings: 3 }))
        this._fx.spawn(new ParticleBurst({ x, y, colors: FX_COLORS.spell, count: 28, speed: 180, duration: 0.7, size: 5 }))
    }

    /**
     * FX : soin (onde verte douce + burst doré).
     */
    _fxHeal(target) {
        const { x, y } = this._centerOf(target)
        this._fx.spawn(new ShockwaveRing({ x, y, color: '#4ade80', maxRadius: 100, duration: 0.6, rings: 2, lineWidth: 2 }))
        this._fx.spawn(new ParticleBurst({ x, y, colors: FX_COLORS.heal, count: 22, speed: 140, duration: 0.8, size: 4 }))
    }

    // =====================
    // DRAG & DROP
    // =====================

    /**
     * Rend un élément draggable (mouse + touch).
     *
     * @param {HTMLElement} el       - Élément source
     * @param {Object}      dragInfo - Données attachées au drag
     */
    _makeDraggable(el, dragInfo) {
        el.style.cursor = 'grab'

        el.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return
            e.preventDefault()
            this._inputState = {
                source: 'mouse',
                el,
                dragInfo,
                startX: e.clientX,
                startY: e.clientY,
                active: false
            }
        })

        el.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return
            const touch = e.touches[0]
            this._inputState = {
                source: 'touch',
                el,
                dragInfo,
                startX: touch.clientX,
                startY: touch.clientY,
                active: false
            }
        }, { passive: true })
    }

    /**
     * Enregistre un élément comme cible de drop.
     */
    _registerDropTarget(el, highlightAttr, acceptFn, dropFn) {
        this._dropTargets.push({ el, highlightAttr, acceptFn, dropFn })
    }

    /**
     * Ajoute drop-hint sur toutes les cibles valides pour le drag en cours.
     */
    _showDropHints() {
        for (const { el, acceptFn } of this._dropTargets) {
            if (this._dragState && acceptFn(this._dragState)) {
                el.setAttribute('drop-hint', '')
            }
        }
    }

    /**
     * Retire drop-hint et drop-target/drop-active de toutes les cibles.
     */
    _clearDropHints() {
        for (const { el } of this._dropTargets) {
            el.removeAttribute('drop-hint')
            el.removeAttribute('drop-active')
            el.removeAttribute('drop-target')
        }
    }

    // =====================
    // UNIFIED DRAG (mouse + touch)
    // =====================

    /**
     * Gère le mouvement pendant un drag (mouse ou touch).
     */
    _handleDragMove(x, y, source) {
        const s = this._inputState
        if (!s || s.source !== source) return

        if (!s.active) {
            const dx = x - s.startX
            const dy = y - s.startY
            if (dx * dx + dy * dy < 100) return
            this._activateDrag(s, x, y)
        }

        if (!s.ghost) return

        s.ghost.style.left = `${x - s.cardW / 2}px`
        s.ghost.style.top = `${y - s.cardH * 0.6}px`

        const dx = x - s.prevX
        const dy = y - s.prevY
        this._updateGhostTilt(s, dx, dy)

        s.prevX = x
        s.prevY = y
        this._updateDropHighlight(x, y)
    }

    /**
     * Active le drag : crée le ghost 3D et affiche les drop hints.
     */
    _activateDrag(s, x, y) {
        s.active = true
        this._dragState = s.dragInfo
        s.el.classList.add('dragging')
        s.prevX = x
        s.prevY = y

        const ghostData = this._createDragGhost(s.el, x, y)
        Object.assign(s, ghostData, {
            ghostScene: ghostData.scene,
            ghostShine: ghostData.shine,
            ghostShadow: ghostData.shadow,
            tiltX: 0,
            tiltY: 0
        })

        this._showDropHints()
    }

    /**
     * Fin du drag : exécute le drop ou anime un retour invalide.
     */
    _handleDragEnd(x, y, source) {
        const s = this._inputState
        if (!s || s.source !== source) return

        if (s.active) {
            const target = this._findDropTarget(x, y)

            s.el.classList.remove('dragging')
            this._clearDropHints()

            if (target && this._dragState && target.acceptFn(this._dragState)) {
                const { ghost, ghostScene: scene } = s
                const cardId = this._dragState.cardId
                const isCreature = this._dragState.cardType === CardType.CREATURE

                target.dropFn(this._dragState, target.el)
                this._dragState = null
                this._inputState = null
                this.render()

                if (ghost && isCreature) {
                    this._flyGhostToCard(ghost, scene, s.ghostShine, s.ghostShadow, cardId)
                } else if (ghost) {
                    ghost.remove()
                }
                return
            }

            this._animateInvalidDrop(s.ghost, s.ghostScene)
            this._dragState = null
        }

        this._inputState = null
    }

    // =====================
    // GHOST 3D (création + tilt)
    // =====================

    /**
     * Crée le ghost 3D complet (carte clonée, reflet, ombre).
     * Retourne { ghost, scene, shine, shadow, cardW, cardH }.
     */
    _createDragGhost(srcCard, x, y) {
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
     */
    _updateGhostTilt(state, dx, dy) {
        const targetTiltY = Math.max(-50, Math.min(50, dx * 6))
        const targetTiltX = Math.max(-35, Math.min(35, -dy * 4))
        state.tiltX += (targetTiltX - state.tiltX) * 0.4
        state.tiltY += (targetTiltY - state.tiltY) * 0.4

        const tx = state.tiltX
        const ty = state.tiltY

        state.ghostScene.style.transform =
            `rotateY(${ty.toFixed(1)}deg) rotateX(${tx.toFixed(1)}deg)`

        if (state.ghostShine) {
            const sx = 50 + ty * 2
            const sy = 50 + tx * 2
            state.ghostShine.style.background =
                `radial-gradient(ellipse at ${sx.toFixed(0)}% ${sy.toFixed(0)}%, rgba(255,255,255,0.25) 0%, transparent 50%)`
        }

        if (state.ghostShadow) {
            state.ghostShadow.style.transform =
                `translateX(${(-ty * 0.8).toFixed(0)}px) scaleX(${(1 + Math.abs(ty) * 0.02).toFixed(2)})`
            state.ghostShadow.style.opacity =
                `${Math.max(0.15, 0.5 - Math.abs(tx) * 0.008).toFixed(2)}`
        }
    }

    // =====================
    // GHOST LANDING ANIMATION
    // =====================

    /**
     * Anime le ghost vers la carte réelle sur le board,
     * puis cross-fade ghost → carte.
     *
     * @param {HTMLElement} ghost  - Conteneur ghost fixe
     * @param {HTMLElement} scene  - Scène 3D du ghost
     * @param {HTMLElement} shine  - Overlay reflet
     * @param {HTMLElement} shadow - Ombre projetée
     * @param {string}      cardId - ID de la carte cible sur le board
     */
    _flyGhostToCard(ghost, scene, shine, shadow, cardId) {
        const boardCard = this._root.querySelector(
            `tcg-card[data-card-id="${cardId}"]`
        )
        if (!boardCard) {
            ghost.remove()
            return
        }

        const targetRect = boardCard.getBoundingClientRect()

        this._flyToTarget(ghost, scene, shine, shadow, targetRect)

        // Timeout matching flight duration (250ms + small buffer)
        setTimeout(() => {
            if (!ghost.parentNode) return
            this._bounceAndReveal(ghost, boardCard)
        }, 280)

        // Fallback safety net
        setTimeout(() => {
            if (ghost.parentNode) {
                ghost.remove()
                boardCard.style.opacity = ''
                requestAnimationFrame(() => {
                    boardCard.setAttribute('summoning-sickness', '')
                })
            }
        }, 900)
    }

    /**
     * Phase 1 : vol du ghost vers la position cible.
     * Anime left/top via transform scale pour éviter téléporation.
     * 
     * Au lieu de changer width/height lors du vol,
     * on utilise transform: scale() qui préserve le centre.
     */
    _flyToTarget(ghost, scene, shine, shadow, targetRect) {
        const ease = '0.25s cubic-bezier(0.2,0,0.2,1)'

        // Récupérer les dimensions actuelles du ghost
        const currentRect = ghost.getBoundingClientRect()
        const currentW = currentRect.width
        const currentH = currentRect.height

        // Calculer le scale factor pour la carte finale
        const scaleW = targetRect.width / currentW
        const scaleH = targetRect.height / currentH
        const scale = Math.max(scaleW, scaleH)

        // Calculer la position du centre du ghost actuellement
        const currentCenterX = currentRect.left + currentW / 2
        const currentCenterY = currentRect.top + currentH / 2

        // Calculer où le centre doit arriver
        const targetCenterX = targetRect.left + targetRect.width / 2
        const targetCenterY = targetRect.top + targetRect.height / 2

        // Calculer les offsets pour centrer le scale
        const offsetX = targetCenterX - currentCenterX
        const offsetY = targetCenterY - currentCenterY

        ghost.style.transition = ['left', 'top', 'transform', 'perspective']
            .map(p => `${p} ${ease}`).join(', ')
        
        // Animer vers la position finale avec scale
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
     * Phase 2 : rebond (scale up) puis cross-fade (scale down + fade out)
     * simultanément pour éviter tout glitch visuel.
     */
    _bounceAndReveal(ghost, boardCard) {
        ghost.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'

        requestAnimationFrame(() => {
            ghost.style.transform = 'scale(1.15)'

            setTimeout(() => {
                // Scale-back + fade-out simultanés
                ghost.style.transition =
                    'transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.15s ease-out'
                ghost.style.transform = 'scale(1)'
                ghost.style.opacity = '0'

                boardCard.style.transition = 'opacity 0.15s ease-in'
                boardCard.style.opacity = '1'

                // Cleanup after fade completes (~200ms)
                setTimeout(() => {
                    if (ghost.parentNode) ghost.remove()
                    boardCard.style.transition = ''
                    boardCard.style.opacity = ''
                    requestAnimationFrame(() => {
                        boardCard.setAttribute('summoning-sickness', '')
                    })
                }, 220)
            }, 150)
        })
    }

    /**
     * Animation de drop invalide : la carte retombe et disparaît.
     */
    _animateInvalidDrop(ghost, scene) {
        if (!ghost || !scene) return
        scene.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in'
        scene.style.transform = 'rotateX(50deg) scale(0.7)'
        scene.style.opacity = '0'
        setTimeout(() => ghost.remove(), 310)
    }

    // =====================
    // DROP TARGET HELPERS
    // =====================

    /**
     * Trouve la cible de drop sous les coordonnées viewport (x, y).
     * Parcourt en ordre inverse pour prioriser les éléments plus spécifiques.
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

    /**
     * Met en surbrillance la cible sous le curseur/doigt pendant le drag.
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

    // =====================
    // RENDER SECTIONS
    // =====================

    _renderTabBar() {
        const bar = this._el('nav', 'tab-bar')

        const tabs = [
            { id: 'game', icon: '⚔', label: 'Game' },
            { id: 'log', icon: '📋', label: 'Log' }
        ]

        for (const tab of tabs) {
            const btn = this._el('button', `tab-btn${this._activePanel === tab.id ? ' active' : ''}`)
            btn.innerHTML = `<span class="tab-icon">${tab.icon}</span>${tab.label}`
            btn.addEventListener('click', () => {
                this._activePanel = tab.id
                this.render()
            })
            bar.appendChild(btn)
        }

        return bar
    }

    _renderControls(activePlayer, isGameOver) {
        const bar = this._el('div', 'controls')

        const endTurnBtn = this._el('button', 'btn btn-primary')
        endTurnBtn.textContent = 'End Turn'
        endTurnBtn.disabled = isGameOver
        endTurnBtn.addEventListener('click', () => {
            this._engine.enqueueCommand(new EndTurnCommand({ playerId: activePlayer }))
            this._engine.runUntilIdle()
            this.render()
        })

        const newGameBtn = this._el('button', 'btn btn-secondary')
        newGameBtn.textContent = 'New Game'
        newGameBtn.addEventListener('click', () => this.start())

        const replayBtn = this._el('button', 'btn btn-secondary')
        replayBtn.textContent = 'Replay'
        replayBtn.addEventListener('click', () => this._doReplay())

        bar.append(endTurnBtn, newGameBtn, replayBtn)
        return bar
    }

    _renderStatusBar(state) {
        const bar = this._el('div', 'status-bar')
        const activeId = state.turnState.activePlayerId
        bar.innerHTML = `
            <span>Turn ${state.turnState.turnNumber}</span>
            <span>Active: <strong>${activeId}</strong></span>
            <span>Phase: ${state.turnState.phase}</span>
        `
        return bar
    }

    _renderPlayerArea(state, playerId, activePlayer, mirrored = false) {
        const player = state.players[playerId]
        const isActive = playerId === activePlayer
        const isGameOver = state.turnState.phase === 'game_over'

        // Player HUD
        const hud = document.createElement('player-hud')
        hud.setAttribute('name', playerId)
        if (mirrored) hud.setAttribute('mirrored', '')
        hud.setAttribute('hp', player.attributes.hp ?? 0)
        hud.setAttribute('max-hp', '20')
        hud.setAttribute('mana', player.attributes.mana ?? 0)
        hud.setAttribute('max-mana', player.attributes.maxMana ?? 0)
        hud.setAttribute('deck-count', this._cardsInZone(state, `deck_${playerId}`).length)
        hud.setAttribute('grave-count', this._cardsInZone(state, `graveyard_${playerId}`).length)
        if (isActive) hud.setAttribute('active', '')

        // Drop target : joueur ennemi (attaque directe + sorts offensifs)
        if (!isActive && !isGameOver) {
            this._registerDropTarget(hud, 'drop-target',
                (drag) =>
                    drag.action === 'attack' ||
                    (drag.action === 'play' && drag.cardType === CardType.SPELL && drag.effect === 'DEAL_DAMAGE'),
                (drag, target) => {
                    if (drag.action === 'attack') {
                        this._fxAttack(target)
                        this._engine.enqueueCommand(new AttackCommand({
                            playerId: drag.playerId,
                            attackerId: drag.cardId,
                            targetId: playerId
                        }))
                    } else {
                        this._fxSpell(target)
                        this._engine.enqueueCommand(new PlaySpellCommand({
                            playerId: drag.playerId,
                            cardId: drag.cardId,
                            targetId: playerId
                        }))
                    }
                    this._engine.runUntilIdle()
                }
            )
        }

        // Drop target : joueur actif (sorts de soin)
        if (isActive && !isGameOver) {
            this._registerDropTarget(hud, 'drop-target',
                (drag) =>
                    drag.action === 'play' &&
                    drag.cardType === CardType.SPELL &&
                    drag.effect === 'RESTORE_HP',
                (drag, target) => {
                    this._fxHeal(target)
                    this._engine.enqueueCommand(new PlaySpellCommand({
                        playerId: drag.playerId,
                        cardId: drag.cardId,
                        targetId: playerId
                    }))
                    this._engine.runUntilIdle()
                }
            )
        }

        // Board zone
        const boardZone = document.createElement('card-zone')
        boardZone.setAttribute('type', 'board')

        // Drop target : zone board du joueur actif (jouer créatures)
        if (isActive && !isGameOver) {
            this._registerDropTarget(boardZone, 'drop-active',
                (drag) => drag.action === 'play' && drag.cardType === CardType.CREATURE,
                (drag, target) => {
                    this._landingCardId = drag.cardId
                    this._engine.enqueueCommand(new PlayCreatureCommand({
                        playerId: drag.playerId,
                        cardId: drag.cardId
                    }))
                    this._engine.runUntilIdle()
                }
            )
        }

        for (const card of this._cardsInZone(state, `board_${playerId}`)) {
            boardZone.appendChild(this._renderBoardCard(card, playerId, isActive, state))
        }
        hud.appendChild(boardZone)

        // Hand zone
        if (isActive) {
            const handZone = document.createElement('card-zone')
            handZone.setAttribute('type', 'hand')
            for (const card of this._cardsInZone(state, `hand_${playerId}`)) {
                handZone.appendChild(this._renderHandCard(card, playerId, state))
            }
            hud.appendChild(handZone)
        }

        return hud
    }

    _renderBoardCard(card, playerId, isActive, state) {
        const def = getCardDefinition(card.definitionId)
        const el = document.createElement('tcg-card')
        const isGameOver = state.turnState.phase === 'game_over'

        el.setAttribute('data-card-id', card.id)
        el.setAttribute('definition-id', card.definitionId)
        el.setAttribute('name', def?.name ?? card.definitionId)
        el.setAttribute('cost', card.attributes.cost)
        el.setAttribute('type', card.attributes.type)
        el.setAttribute('power', card.attributes.power)
        el.setAttribute('hp', card.attributes.hp)
        if (card.attributes.hasAttacked) el.setAttribute('has-attacked', '')

        // Si cette carte est en cours de vol (ghost → board), la cacher
        // et différer l'attribut summoning-sickness pour la transition CSS
        if (card.id === this._landingCardId) {
            el.style.opacity = '0'
            this._landingCardId = null
        } else {
            if (card.attributes.summoningSickness) el.setAttribute('summoning-sickness', '')
        }

        const canAttack = isActive &&
            !card.attributes.summoningSickness &&
            !card.attributes.hasAttacked &&
            !isGameOver

        // Drag source : attaquant
        if (canAttack) {
            el.setAttribute('can-attack', '')
            this._makeDraggable(el, {
                action: 'attack',
                cardId: card.id,
                playerId
            })
        }

        // Drop target : créature ennemie (attaque ou sort offensif)
        if (!isActive && !isGameOver) {
            this._registerDropTarget(el, 'drop-target',
                (drag) =>
                    drag.action === 'attack' ||
                    (drag.action === 'play' && drag.cardType === CardType.SPELL && drag.effect === 'DEAL_DAMAGE'),
                (drag, target) => {
                    if (drag.action === 'attack') {
                        this._fxAttack(target)
                        this._engine.enqueueCommand(new AttackCommand({
                            playerId: drag.playerId,
                            attackerId: drag.cardId,
                            targetId: card.id
                        }))
                    } else {
                        this._fxSpell(target)
                        this._engine.enqueueCommand(new PlaySpellCommand({
                            playerId: drag.playerId,
                            cardId: drag.cardId,
                            targetId: card.id
                        }))
                    }
                    this._engine.runUntilIdle()
                }
            )
        }

        return el
    }

    _renderHandCard(card, playerId, state) {
        const def = getCardDefinition(card.definitionId)
        const el = document.createElement('tcg-card')
        const mana = state.players[playerId].attributes.mana
        const canPlay = card.attributes.cost <= mana && state.turnState.phase !== 'game_over'

        el.setAttribute('definition-id', card.definitionId)
        el.setAttribute('name', def?.name ?? card.definitionId)
        el.setAttribute('cost', card.attributes.cost)
        el.setAttribute('type', card.attributes.type)

        if (card.attributes.type === CardType.CREATURE) {
            el.setAttribute('power', card.attributes.power)
            el.setAttribute('hp', card.attributes.hp)
        } else {
            const fmt = EFFECT_TEXT[card.attributes.effect]
            el.setAttribute('effect', fmt ? fmt(def?.effectValue) : card.attributes.effect)
        }

        if (canPlay) {
            el.setAttribute('playable', '')
            this._makeDraggable(el, {
                action: 'play',
                cardId: card.id,
                playerId,
                cardType: card.attributes.type,
                effect: card.attributes.effect
            })
        }

        return el
    }

    _renderEventLog() {
        const container = this._el('div', 'event-log')
        const title = this._el('div', 'log-title')
        title.textContent = 'Event Log'
        container.appendChild(title)

        const list = this._el('div', 'log-list')
        const recent = this._eventLog.slice(-50)
        for (const entry of recent) {
            const line = this._el('div', 'log-entry')
            line.textContent = entry.text
            list.appendChild(line)
        }
        container.appendChild(list)
        list.scrollTop = list.scrollHeight
        return container
    }

    // =====================
    // REPLAY
    // =====================

    _doReplay() {
        if (!this._engine) return
        this._fx.clear()

        const replay = this._engine.exportReplay()
        this._eventLog = [{ text: 'Replaying...' }]

        const engine2 = createGame({ seed: 0 })
        engine2.importReplay(replay)
        engine2.domainEventBus.on(batch => {
            for (const event of batch) {
                this._eventLog.push({ text: `[R] ${event.type}: ${JSON.stringify(event.payload)}` })
            }
        })
        engine2.runUntilIdle()

        const match = this._engine.getViewHash() === engine2.getViewHash()
        this._eventLog.push({
            text: match ? 'Replay OK — state identical' : 'Replay MISMATCH — state differs!'
        })

        this._engine = engine2
        this.render()
    }

    // =====================
    // UTILS
    // =====================

    _el(tag, className = '') {
        const el = document.createElement(tag)
        if (className) el.className = className
        return el
    }

    _cardsInZone(state, zoneId) {
        return Object.values(state.cards).filter(c => c.zoneId === zoneId)
    }
}
