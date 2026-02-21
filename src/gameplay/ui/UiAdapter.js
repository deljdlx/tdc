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

import { startGame, createGame } from '../setup.js'
import PlayCreatureCommand from '../commands/PlayCreatureCommand.js'
import PlaySpellCommand from '../commands/PlaySpellCommand.js'
import AttackCommand from '../commands/AttackCommand.js'
import EndTurnCommand from '../commands/EndTurnCommand.js'
import { getCardDefinition, CardType } from '../definitions/cards.js'
import FxCanvas from '../../fx/FxCanvas.js'
import MouseTrail from '../../fx/MouseTrail.js'
import CherryBlossoms from '../../fx/CherryBlossoms.js'
import DragDropManager from './DragDropManager.js'
import GhostAnimator from './GhostAnimator.js'
import FxController from './FxController.js'
import CommandGraphRenderer from './CommandGraphRenderer.js'
import { CATEGORY, CATEGORY_COLORS, CATEGORY_LABELS } from './commandGraphData.js'
import '../../components/TcgCard.js'
import '../../components/CardZone.js'
import '../../components/PlayerLifeBar.js'
import '../../components/PlayerHud.js'
import CardModal from '../../components/CardModal.js'

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

    /** @type {boolean} */
    _mouseTrailEnabled

    /** @type {string} */
    _mouseTrailPreset

    /** @type {string} */
    _activePanel

    /** @type {string|null} */
    _landingCardId

    /** @type {CardModal} */
    _cardModal

    /** @type {string} Message de statut pour le panneau trail */
    _trailStatusMessage

    /** @type {Object} Surcharges manuelles des paramètres du trail */
    _mouseTrailOverrides

    /** @type {CherryBlossoms|null} Effet de fond permanent de pétales */
    _cherryBlossoms

    constructor(rootElement) {
        this._root = rootElement
        this._eventLog = []
        this._engine = null
        this._fx = new FxCanvas(rootElement, { fullscreen: true })
        this._fxController = new FxController(this._fx)
        this._dragDropManager = new DragDropManager()
        this._ghostAnimator = new GhostAnimator()
        this._mouseTrail = null
        this._mouseTrailEnabled = true
        this._mouseTrailPreset = 'AURORA'
        this._mouseTrailOverrides = {}
        this._activePanel = 'game'
        this._landingCardId = null
        this._cardModal = this._createCardModal()
        this._trailStatusMessage = ''
        this._graphRenderer = new CommandGraphRenderer()
        this._cherryBlossoms = null

        this._setupBackgroundEffects()
        this._setupMouseTrail()
        this._setupCardInspect()
        this._dragDropManager.init()
    }

    /**
     * Crée et attache la modale d'inspection à document.body.
     * Vit en dehors de #app pour ne pas être effacée par render().
     */
    _createCardModal() {
        const modal = new CardModal()
        document.body.appendChild(modal)
        return modal
    }

    /**
     * Écoute l'événement card-inspect (long press / clic droit) sur les cartes.
     */
    _setupCardInspect() {
        this._root.addEventListener('card-inspect', (e) => {
            const cardId = e.detail?.cardId
            if (!cardId || !this._engine) return

            const card = this._engine.state.cards[cardId]
            if (!card) return

            const def = getCardDefinition(card.definitionId)
            this._cardModal.open({
                name: def?.name ?? card.definitionId,
                type: card.attributes.type,
                cost: card.attributes.cost,
                definitionId: card.definitionId,
                power: card.attributes.power,
                hp: card.attributes.hp,
                effect: card.attributes.effect,
                effectValue: def?.effectPayload?.amount,
                summoningSickness: card.attributes.summoningSickness,
                hasAttacked: card.attributes.hasAttacked,
                canAttack: !card.attributes.summoningSickness &&
                    !card.attributes.hasAttacked &&
                    card.zoneId?.startsWith('board_'),
            })
        })
    }

    /**
     * Configure les effets de fond permanents (pétales, etc.)
     */
    _setupBackgroundEffects() {
        this._cherryBlossoms = new CherryBlossoms({ density: 0.3 })
        this._fx.spawn(this._cherryBlossoms)
    }

    /**
     * Configure le trail souris.
     */
    _setupMouseTrail() {
        document.addEventListener('mousemove', (e) => {
            if (!this._mouseTrailEnabled) return

            if (!this._mouseTrail || !this._mouseTrail.isAlive()) {
                const preset = MouseTrail.getPreset(this._mouseTrailPreset)
                const options = { ...preset, ...this._mouseTrailOverrides }
                this._mouseTrail = new MouseTrail(options)
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
        this._setupBackgroundEffects()

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

        const trailPanel = this._el('div', `panel${this._activePanel === 'trail' ? ' active' : ''}`)
        trailPanel.appendChild(this._renderTrailSettings())
        this._root.appendChild(trailPanel)

        const graphPanel = this._el('div', `panel graph-panel${this._activePanel === 'graph' ? ' active' : ''}`)
        graphPanel.appendChild(this._renderGraphHeader())
        const graphCanvas = this._el('div', 'graph-canvas')
        graphPanel.appendChild(graphCanvas)
        this._root.appendChild(graphPanel)
        if (this._activePanel === 'graph') {
            this._graphRenderer.render(graphCanvas)
        } else {
            this._graphRenderer.destroy()
        }

        this._root.appendChild(this._renderTabBar())
    }

    _renderTabBar() {
        const bar = this._el('nav', 'tab-bar')
        const tabs = [
            { id: 'game', icon: '⚔', label: 'Game' },
            { id: 'log', icon: '📋', label: 'Log' },
            { id: 'trail', icon: '✨', label: 'Trail FX' },
            { id: 'graph', icon: '◈', label: 'Graph' }
        ]

        for (const tab of tabs) {
            const btn = this._el('button', `tab-btn${this._activePanel === tab.id ? ' active' : ''}`)
            btn.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-label">${tab.label}</span>`
            btn.addEventListener('click', () => {
                this._activePanel = tab.id
                this.render()
            })
            bar.appendChild(btn)
        }
        return bar
    }

    _renderGraphHeader() {
        const header = this._el('div', 'graph-header')

        const title = this._el('div', 'graph-title')
        title.textContent = 'Command Graph'
        header.appendChild(title)

        const legend = this._el('div', 'graph-legend')
        for (const cat of Object.values(CATEGORY)) {
            const item = this._el('span', 'graph-legend-item')
            const dot = this._el('span', 'graph-legend-dot')
            dot.style.backgroundColor = CATEGORY_COLORS[cat]
            item.appendChild(dot)
            item.appendChild(document.createTextNode(CATEGORY_LABELS[cat]))
            legend.appendChild(item)
        }

        const dashItem = this._el('span', 'graph-legend-item')
        const dashLine = this._el('span', 'graph-legend-dash')
        dashItem.appendChild(dashLine)
        dashItem.appendChild(document.createTextNode('Conditional'))
        legend.appendChild(dashItem)

        header.appendChild(legend)
        return header
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
                this._consumeGhost()
                this.render()
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
                this._consumeGhost()
                this.render()
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
                const newCard = this._root.querySelector(`[data-card-id="${drag.cardId}"]`)
                if (newCard) this._fxController.fxSummon(newCard)
                this._animateGhostLanding(newCard, drag.cardId)
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
                    this._consumeGhost()
                    this.render()
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

    _renderTrailSettings() {
        const container = this._el('div', 'trail-settings')
        const title = this._el('h2', 'trail-title')
        title.textContent = 'Mouse Trail'
        container.appendChild(title)

        const subtitle = this._el('p', 'trail-subtitle')
        subtitle.textContent = 'Configure visual presets and runtime activation.'
        container.appendChild(subtitle)

        container.appendChild(this._renderTrailToggle())
        container.appendChild(this._renderTrailPresetSelect())
        container.appendChild(this._renderTrailParamControls())
        container.appendChild(this._renderTrailJsonControls())

        if (this._trailStatusMessage) {
            const status = this._el('div', 'trail-status')
            status.textContent = this._trailStatusMessage
            container.appendChild(status)
        }

        return container
    }

    _renderTrailToggle() {
        const row = this._el('label', 'trail-row')
        const input = this._el('input')
        input.type = 'checkbox'
        input.checked = this._mouseTrailEnabled
        input.addEventListener('change', () => {
            this._mouseTrailEnabled = input.checked
            if (!this._mouseTrailEnabled) this._mouseTrail = null
            this.render()
        })
        const text = this._el('span')
        text.textContent = 'Enable mouse trail'
        row.append(input, text)
        return row
    }

    _renderTrailPresetSelect() {
        const row = this._el('label', 'trail-row trail-row-column')
        const label = this._el('span')
        label.textContent = 'Preset'
        const select = this._el('select', 'trail-select')
        for (const name of MouseTrail.listPresetNames()) {
            const option = this._el('option')
            option.value = name
            option.textContent = name
            option.selected = name === this._mouseTrailPreset
            select.appendChild(option)
        }
        select.addEventListener('change', () => {
            this._mouseTrailPreset = select.value
            this._mouseTrailOverrides = {}
            this._mouseTrail = null
            this.render()
        })
        row.append(label, select)
        return row
    }

    /**
     * Applique une surcharge de paramètre et relance le trail.
     */
    _applyTrailOverride(key, value) {
        this._mouseTrailOverrides[key] = value
        this._mouseTrail = null
    }

    /**
     * Résout la valeur effective d'un paramètre (override > preset).
     */
    _trailParam(key) {
        if (key in this._mouseTrailOverrides) return this._mouseTrailOverrides[key]
        const preset = MouseTrail.getPreset(this._mouseTrailPreset)
        return preset[key]
    }

    /**
     * Contrôles de réglage des paramètres du trail (couleurs, forme, durée, intensité).
     */
    _renderTrailParamControls() {
        const section = this._el('div', 'trail-params')

        const heading = this._el('h3', 'trail-params-heading')
        heading.textContent = 'Parameters'
        section.appendChild(heading)

        section.appendChild(this._renderTrailColorPickers())
        section.appendChild(this._renderTrailShapeSelect())
        section.appendChild(this._renderTrailSlider('maxPoints', 'Particles', 10, 150, 5, ''))
        section.appendChild(this._renderTrailSlider('lifetime', 'Duration', 0.15, 1.5, 0.05, 's'))
        section.appendChild(this._renderTrailSlider('minSize', 'Min size', 0.5, 5, 0.5, 'px'))
        section.appendChild(this._renderTrailSlider('maxSize', 'Max size', 1, 15, 0.5, 'px'))
        section.appendChild(this._renderTrailSlider('inertia', 'Inertia', 0, 1, 0.05, ''))
        section.appendChild(this._renderTrailSlider('spread', 'Spread', 0, 40, 1, 'px'))
        section.appendChild(this._renderTrailSlider('glowAlpha', 'Glow', 0, 0.5, 0.01, ''))
        section.appendChild(this._renderTrailSlider('ribbonWidth', 'Ribbon', 0.5, 6, 0.5, 'px'))
        section.appendChild(this._renderTrailSlider('sparklesPerPoint', 'Sparkles', 0, 6, 1, ''))
        section.appendChild(this._renderTrailSlider('sparkleSpeed', 'Sparkle speed', 10, 120, 5, ''))

        const resetBtn = this._el('button', 'btn btn-secondary btn-sm')
        resetBtn.textContent = 'Reset params'
        resetBtn.addEventListener('click', () => {
            this._mouseTrailOverrides = {}
            this._mouseTrail = null
            this.render()
        })
        section.appendChild(resetBtn)

        return section
    }

    /**
     * Sélecteurs de couleurs pour la palette du trail (4 slots).
     */
    _renderTrailColorPickers() {
        const preset = MouseTrail.getPreset(this._mouseTrailPreset)
        const colors = this._mouseTrailOverrides.colors ?? preset.colors
        const row = this._el('div', 'trail-color-row')

        const label = this._el('span', 'trail-param-label')
        label.textContent = 'Colors'
        row.appendChild(label)

        const pickers = this._el('div', 'trail-color-pickers')
        const slotCount = Math.min(colors.length, 6)

        for (let i = 0; i < slotCount; i++) {
            const input = this._el('input', 'trail-color-input')
            input.type = 'color'
            input.value = colors[i]
            input.addEventListener('input', () => {
                const updated = [...colors]
                updated[i] = input.value
                this._applyTrailOverride('colors', updated)
            })
            pickers.appendChild(input)
        }
        row.appendChild(pickers)
        return row
    }

    /**
     * Sélecteur de forme des particules.
     */
    _renderTrailShapeSelect() {
        const shapes = ['circle', 'square', 'star', 'diamond', 'triangle']
        const current = this._trailParam('shape') ?? 'circle'

        const row = this._el('div', 'trail-param-row')
        const label = this._el('span', 'trail-param-label')
        label.textContent = 'Shape'

        const select = this._el('select', 'trail-select')
        for (const s of shapes) {
            const opt = this._el('option')
            opt.value = s
            opt.textContent = s
            opt.selected = s === current
            select.appendChild(opt)
        }
        select.addEventListener('change', () => {
            this._applyTrailOverride('shape', select.value)
            this.render()
        })

        row.append(label, select)
        return row
    }

    /**
     * Slider générique pour un paramètre numérique du trail.
     */
    _renderTrailSlider(key, label, min, max, step, unit) {
        const current = this._trailParam(key) ?? min
        const row = this._el('div', 'trail-param-row')

        const lbl = this._el('span', 'trail-param-label')
        lbl.textContent = label

        const value = this._el('span', 'trail-param-value')
        value.textContent = `${current}${unit}`

        const input = this._el('input', 'trail-slider')
        input.type = 'range'
        input.min = min
        input.max = max
        input.step = step
        input.value = current
        input.addEventListener('input', () => {
            const v = Number(input.value)
            value.textContent = `${v}${unit}`
            this._applyTrailOverride(key, v)
        })

        row.append(lbl, input, value)
        return row
    }

    /**
     * Boutons Import / Export / Reset pour les presets JSON.
     */
    _renderTrailJsonControls() {
        const row = this._el('div', 'trail-row trail-json-controls')

        const importBtn = this._el('button', 'btn btn-secondary btn-sm')
        importBtn.textContent = 'Import JSON'
        importBtn.addEventListener('click', () => this._importTrailPresets())

        const exportBtn = this._el('button', 'btn btn-secondary btn-sm')
        exportBtn.textContent = 'Export JSON'
        exportBtn.addEventListener('click', () => this._exportTrailPresets())

        const resetBtn = this._el('button', 'btn btn-secondary btn-sm')
        resetBtn.textContent = 'Reset'
        resetBtn.addEventListener('click', () => {
            MouseTrail.resetPresets()
            this._mouseTrail = null
            this._trailStatusMessage = 'Presets reset to defaults.'
            this.render()
        })

        row.append(importBtn, exportBtn, resetBtn)
        return row
    }

    /**
     * Ouvre un sélecteur de fichier et charge le JSON sélectionné.
     */
    _importTrailPresets() {
        const input = this._el('input')
        input.type = 'file'
        input.accept = '.json'
        input.addEventListener('change', () => {
            const file = input.files[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result)
                    const { added, errors } = MouseTrail.loadPresetsFromJSON(data)
                    this._mouseTrail = null
                    const parts = []
                    if (added.length > 0) parts.push(`${added.length} preset(s) loaded`)
                    if (errors.length > 0) parts.push(`${errors.length} error(s)`)
                    this._trailStatusMessage = parts.join(', ') || 'No presets found in file.'
                } catch {
                    this._trailStatusMessage = 'Invalid JSON file.'
                }
                this.render()
            }
            reader.readAsText(file)
        })
        input.click()
    }

    /**
     * Télécharge les presets actuels en fichier JSON.
     */
    _exportTrailPresets() {
        const data = MouseTrail.exportPresets()
        const json = JSON.stringify(data, null, 4)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = this._el('a')
        a.href = url
        a.download = 'trail-presets.json'
        a.click()
        URL.revokeObjectURL(url)
        this._trailStatusMessage = 'Presets exported.'
        this.render()
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

    _consumeGhost() {
        const ghostData = this._dragDropManager.getLastDragGhostData()
        if (ghostData?.ghost?.parentNode) ghostData.ghost.remove()
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
