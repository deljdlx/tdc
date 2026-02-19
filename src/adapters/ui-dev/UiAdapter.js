/**
 * UiAdapter — orchestrateur de l'UI du TCG.
 *
 * Responsabilités limitées à: 
 * - Cycle de render et gestion d'état de panel  
 * - Intégration avec le moteur et exécution de commandes
 * - Intégration avec les sous-systèmes (drag/drop, FX, ghost)
 *
 * Les logiques complexes sont déléguées à:
 * - DragDropManager : gestion drag/drop souris + touch
 * - GhostAnimator : animations 3D et landing
 * - FxController : effets visuels centralisés
 */

import { startGame, createGame } from '../../gameplay/setup.js'
import PlayCreatureCommand from '../../gameplay/commands/PlayCreatureCommand.js'
import PlaySpellCommand from '../../gameplay/commands/PlaySpellCommand.js'
import AttackCommand from '../../gameplay/commands/AttackCommand.js'
import EndTurnCommand from '../../gameplay/commands/EndTurnCommand.js'
import { getCardDefinition, CardType } from '../../gameplay/definitions/cards.js'
import FxCanvas from '../../fx/FxCanvas.js'
import MouseTrail from '../../fx/MouseTrail.js'
import DragDropManager from './DragDropManager.js'
import GhostAnimator from './GhostAnimator.js'
import FxController from './FxController.js'
import '../../components/TcgCard.js'
import '../../components/CardZone.js'
import '../../components/PlayerHud.js'

const EFFECT_TEXT = {
    DEAL_DAMAGE: (v) => `Deal ${v} damage`,
    RESTORE_HP: (v) => `Restore ${v} HP`
}

export default class UiAdapter {
    /** @type {import('../../core/engine/Engine.js').default} */
    _engine

    /** @type {HTMLElement} */
    _root

    /** @type {FxCanvas} */
    _fx

    /** @type {FxController} */
    _fxController

    /** @type {DragDropManager} */
    _dragDropManager

    /** @type {GhostAnimator} */
    _ghostAnimator

    /** @type {Object[]} */
    _eventLog

    /** @type {MouseTrail|null} */
    _mouseTrail

    /** @type {string} */
    _activePanel

    /** @type {string|null} */
    _landingCardId

    constructor(rootElement) {
        this._root = rootElement
        this._eventLog = []
        this._engine = null
        this._fx = new FxCanvas(rootElement, { fullscreen: true })
        this._fxController = new FxController(this._fx)
        this._dragDropManager = new DragDropManager()
        this._ghostAnimator = new GhostAnimator()
        this._mouseTrail = null
        this._activePanel = 'game'
        this._landingCardId = null

        this._setupMouseTrail()
        this._dragDropManager.init()
    }

    /**
     * Configure le trail souris.
     */
    _setupMouseTrail() {
        document.addEventListener('mousemove', (e) => {
            if (!this._mouseTrail || !this._mouseTrail.isAlive()) {
                this._mouseTrail = new MouseTrail(MouseTrail.PRESETS.MAGIC)
                this._fx.spawn(this._mouseTrail)
            }
            this._mouseTrail.addPoint(e.clientX, e.clientY)
        })
    }

    /**
     * Lance une nouvelle partie.
     */
    start() {
        const seed = Math.floor(Math.random() * 100000)
        this._engine = startGame({ seed })
        this._eventLog = [{ text: `Game started (seed: ${seed})` }]
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
     * Rend l'UI complète.
     */
    render() {
        if (!this._engine) return

        this._dragDropManager.resetDropTargets()

        const state = this._engine.state
        const activePlayer = state.turnState.activePlayerId
        const playerIds = Object.keys(state.players)
        const isGameOver = state.turnState.phase === 'game_over'

        const fxCanvas = this._root.querySelector('.fx-canvas')
        this._root.innerHTML = ''
        if (fxCanvas) this._root.appendChild(fxCanvas)

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

        const logPanel = this._el('div', `panel${this._activePanel === 'log' ? ' active' : ''}`)
        logPanel.appendChild(this._renderEventLog())
        this._root.appendChild(logPanel)

        this._root.appendChild(this._renderTabBar())
    }

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

        if (!isActive && !isGameOver) {
            this._registerEnemyPlayerDropTarget(hud, state, playerId)
        }

        if (isActive && !isGameOver) {
            this._registerAllyPlayerDropTarget(hud, state, playerId)
        }

        const boardZone = document.createElement('card-zone')
        boardZone.setAttribute('type', 'board')

        if (isActive && !isGameOver) {
            this._registerBoardDropTarget(boardZone, playerId)
        }

        for (const card of this._cardsInZone(state, `board_${playerId}`)) {
            boardZone.appendChild(this._renderBoardCard(card, playerId, isActive, state))
        }
        hud.appendChild(boardZone)

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

    /**
     * Anime le landing du ghost après un drop réussi.
     *
     * @param {HTMLElement|null} targetEl
     * @param {string|null} cardId
     * @returns {Promise<void>}
     */
    async _animateGhostLanding(targetEl, cardId) {
        if (!targetEl || !cardId) return

        const ghostData = this._dragDropManager.getLastDragGhostData()
        if (!ghostData || !ghostData.ghost) return

        const { ghost, scene, shine, shadow } = ghostData
        if (!ghost.parentNode) return

        const targetRect = targetEl.getBoundingClientRect()
        this._ghostAnimator.animateFlying(ghost, scene, shine, shadow, targetRect)

        await new Promise(r => setTimeout(r, 250))
        await this._ghostAnimator.animateBounceAndReveal(ghost, targetEl)
    }

    /**
     * Registre drop target pour joueur ennemi (attaque directe + sorts offensifs).
     */
    _registerEnemyPlayerDropTarget(hud, state, playerId) {
        this._dragDropManager.registerDropTarget(hud, 'drop-target',
            (drag) =>
                drag.action === 'attack' ||
                (drag.action === 'play' && drag.cardType === CardType.SPELL && drag.effect === 'DEAL_DAMAGE'),
            (drag) => {
                if (drag.action === 'attack') {
                    this._fxController.fxAttack(hud)
                    this._engine.enqueueCommand(new AttackCommand({
                        playerId: drag.playerId,
                        attackerId: drag.cardId,
                        targetId: playerId
                    }))
                } else {
                    this._fxController.fxSpell(hud)
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

    /**
     * Registre drop target pour joueur allié (sorts de soin).
     */
    _registerAllyPlayerDropTarget(hud, state, playerId) {
        this._dragDropManager.registerDropTarget(hud, 'drop-target',
            (drag) =>
                drag.action === 'play' &&
                drag.cardType === CardType.SPELL &&
                drag.effect === 'RESTORE_HP',
            (drag) => {
                this._fxController.fxHeal(hud)
                this._engine.enqueueCommand(new PlaySpellCommand({
                    playerId: drag.playerId,
                    cardId: drag.cardId,
                    targetId: playerId
                }))
                this._engine.runUntilIdle()
            }
        )
    }

    /**
     * Registre drop target pour zone board (jouer créatures).
     */
    _registerBoardDropTarget(boardZone, _playerId) {
        this._dragDropManager.registerDropTarget(boardZone, 'drop-active',
            (drag) => drag.action === 'play' && drag.cardType === CardType.CREATURE,
            (drag) => {
                this._landingCardId = drag.cardId
                this._engine.enqueueCommand(new PlayCreatureCommand({
                    playerId: drag.playerId,
                    cardId: drag.cardId
                }))
                this._engine.runUntilIdle()
                this.render()
            }
        )
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

        if (card.id === this._landingCardId) {
            el.style.opacity = '0'
            this._landingCardId = null
        } else if (card.attributes.summoningSickness) {
            el.setAttribute('summoning-sickness', '')
        }

        const canAttack = isActive &&
            !card.attributes.summoningSickness &&
            !card.attributes.hasAttacked &&
            !isGameOver

        if (canAttack) {
            el.setAttribute('can-attack', '')
            this._dragDropManager.makeDraggable(el, {
                action: 'attack',
                cardId: card.id,
                playerId
            })
        }

        if (!isActive && !isGameOver) {
            this._dragDropManager.registerDropTarget(el, 'drop-target',
                (drag) =>
                    drag.action === 'attack' ||
                    (drag.action === 'play' && drag.cardType === CardType.SPELL && drag.effect === 'DEAL_DAMAGE'),
                (drag) => {
                    if (drag.action === 'attack') {
                        this._fxController.fxAttack(el)
                        this._engine.enqueueCommand(new AttackCommand({
                            playerId: drag.playerId,
                            attackerId: drag.cardId,
                            targetId: card.id
                        }))
                    } else {
                        this._fxController.fxSpell(el)
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
            this._dragDropManager.makeDraggable(el, {
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

    _el(tag, className = '') {
        const el = document.createElement(tag)
        if (className) el.className = className
        return el
    }

    _cardsInZone(state, zoneId) {
        return Object.values(state.cards).filter(c => c.zoneId === zoneId)
    }
}
