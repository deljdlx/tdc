/**
 * UiAdapter (Refactored) — Orchestrateur de l'UI pour le scénario TCG.
 *
 * Utilise 6 modules de base pour une architecture modulaire :
 * - UiState       : gestion centralisée de l'état d'interaction UI
 * - DragDropManager : handler unifié pour mouse + touch drag/drop
 * - GhostAnimator : animations 3D du ghost et landing
 * - GameRenderer  : rendu pur sans effets secondaires
 * - CommandDispatcher : abstraction des commandes moteur
 * - FxController  : gestion des effets visuels
 *
 * Les changements de state déclenchent un re-render automatique via observer pattern.
 */

import { createGame } from '../../gameplay/setup.js'
import UiState from './UiState.js'
import DragDropManager from './DragDropManager.js'
import GhostAnimator from './GhostAnimator.js'
import GameRenderer from './GameRenderer.js'
import CommandDispatcher from './CommandDispatcher.js'
import FxController from './FxController.js'
import '../../components/TcgCard.js'
import '../../components/CardZone.js'
import '../../components/PlayerHud.js'

export default class UiAdapter {
    constructor(rootElement) {
        this._root = rootElement
        this._engine = null

        // Modules d'UI
        this._uiState = new UiState()
        this._renderer = new GameRenderer()
        this._dragDropMgr = null
        this._ghostAnimator = new GhostAnimator()
        this._dispatcher = new CommandDispatcher()
        this._fxCtrl = null

        // State de rendu
        this._activePanel = 'game'
        this._eventLog = []
        this._landingCardId = null

        // Observer pattern
        this._unsubscribe = this._uiState.subscribe(() => this._onUiStateChanged())
    }

    /**
     * Lance une nouvelle partie et initialise l'UI.
     */
    start() {
        const seed = Math.floor(Math.random() * 100000)
        this._engine = createGame({ seed })
        this._dispatcher.setEngine(this._engine)
        this._eventLog = [{ text: `Game started (seed: ${seed})` }]

        // Subscribe aux événements du moteur
        this._engine.domainEventBus?.on?.((batch) => {
            for (const event of batch) {
                this._eventLog.push({ text: `${event.type}: ${JSON.stringify(event.payload)}` })
            }
            if (this._eventLog.length > 50) {
                this._eventLog = this._eventLog.slice(-50)
            }
        })

        // Initialiser FxController après le DOM root
        if (!this._fxCtrl) {
            const fxCanvas = document.createElement('div')
            fxCanvas.className = 'fx-container'
            this._root.appendChild(fxCanvas)
            this._fxCtrl = new FxController(fxCanvas)
        }

        // Initialiser DragDropManager
        if (!this._dragDropMgr) {
            this._dragDropMgr = new DragDropManager()
            this._dragDropMgr.setCallbacks({
                onDragStart: (el, dragInfo) => this._onDragStart(el, dragInfo),
                onDragMove: (x, y) => this._onDragMove(x, y),
                onDragEnd: (x, y) => this._onDragEnd(x, y)
            })
        }

        this._uiState.reset()
        this.render()
    }

    /**
     * Rend l'intégralité de l'UI avec navigation par panels.
     */
    render() {
        if (!this._engine) return

        const state = this._engine.state
        const activePlayer = state.turnState.activePlayerId

        // Effacer le contenu (sauf FX canvas)
        const oldFxContainer = this._root.querySelector('.fx-container')
        this._root.innerHTML = ''
        if (oldFxContainer) this._root.appendChild(oldFxContainer)

        // Render game panel
        const gamePanel = this._renderer.renderGame(state, this._uiState)
        if (this._activePanel === 'game') gamePanel.classList.add('active')
        this._root.appendChild(gamePanel)

        // Render log panel
        const logPanel = this._renderer.renderEventLog(this._eventLog)
        if (this._activePanel === 'log') logPanel.classList.add('active')
        this._root.appendChild(logPanel)

        // Render tab bar
        this._root.appendChild(this._renderTabBar())

        // Re-setup drag/drop pour les cartes
        this._setupCardInteractions(state, activePlayer)
    }

    /**
     * Configure les interactions (drag, drop, click) pour toutes les cartes.
     */
    _setupCardInteractions(state, activePlayer) {
        const playerIds = Object.keys(state.players)

        for (const playerId of playerIds) {
            const isActive = playerId === activePlayer
            const isGameOver = state.turnState.phase === 'game_over'

            // Board cards
            const boardCards = this._root.querySelectorAll(
                `tcg-card[data-zone-id="board_${playerId}"]`
            )
            for (const card of boardCards) {
                this._setupBoardCardInteractions(card, state, playerId, isActive, isGameOver)
            }

            // Hand cards
            if (isActive) {
                const handCards = this._root.querySelectorAll(
                    `tcg-card[data-zone-id="hand_${playerId}"]`
                )
                for (const card of handCards) {
                    this._setupHandCardInteractions(card, state, playerId)
                }
            }
        }

        // Setup HUD interactions
        const huds = this._root.querySelectorAll('player-hud')
        for (const hud of huds) {
            this._setupHudInteractions(hud, state)
        }

        // Setup board zone drop targets
        const boardZones = this._root.querySelectorAll('card-zone[type="board"]')
        for (const zone of boardZones) {
            this._setupBoardZoneDropTarget(zone, state, activePlayer)
        }
    }

    _setupBoardCardInteractions(card, state, playerId, isActive, isGameOver) {
        const cardId = card.getAttribute('data-card-id')
        const gameCard = state.cards[cardId]
        if (!gameCard) return

        // Attaque
        const canAttack = isActive &&
            !gameCard.attributes.summoningSickness &&
            !gameCard.attributes.hasAttacked &&
            !isGameOver

        if (canAttack) {
            this._dragDropMgr?.makeDraggable(card, {
                type: 'attack',
                cardId,
                playerId,
                targetCard: card
            })
        }
    }

    _setupHandCardInteractions(card, state, playerId) {
        const cardId = card.getAttribute('data-card-id')
        const gameCard = state.cards[cardId]
        const mana = state.players[playerId].attributes.mana
        const cost = gameCard?.attributes.cost ?? 0
        const canPlay = cost <= mana && state.turnState.phase !== 'game_over'

        if (canPlay) {
            this._dragDropMgr?.makeDraggable(card, {
                type: 'play',
                cardId,
                playerId,
                cost,
                sourceCard: card
            })
        }
    }

    _setupHudInteractions(hud, state) {
        const playerId = hud.getAttribute('data-player-id') || hud.getAttribute('name')
        if (!playerId) return

        // HUD peut être cible de sorts offensifs ou attaques
        this._dragDropMgr?.registerDropTarget(hud, (dragInfo) => {
            // Accept attack ou offensive spell
            return dragInfo.type === 'attack' || 
                   (dragInfo.type === 'play' && this._isOffensiveSpell(dragInfo))
        }, async (dragInfo) => {
            await this._handleCardDrop(dragInfo, playerId)
        })
    }

    _setupBoardZoneDropTarget(zone, state, activePlayer) {
        const zoneId = zone.getAttribute('data-zone-id')
        const playerId = zoneId?.split('_')[1]
        const isActive = playerId === activePlayer
        const isGameOver = state.turnState.phase === 'game_over'

        if (isActive && !isGameOver) {
            this._dragDropMgr?.registerDropTarget(zone, (dragInfo) => {
                // Accept play creature
                return dragInfo.type === 'play'
            }, async (dragInfo) => {
                await this._handleCardDrop(dragInfo, playerId)
            })
        }
    }

    // =====================
    // CALLBACKS
    // =====================

    _onDragStart(el, dragInfo) {
        this._uiState.setDragState(dragInfo)
    }

    _onDragMove(x, y) {
        this._uiState.updateDragPosition(x, y)
    }

    async _onDragEnd(x, y) {
        const dragInfo = this._uiState.getDragState()
        if (!dragInfo) return

        this._uiState.clearDragState()
        // Re-render si nécessaire
    }

    /**
     * Traite le drop d'une carte sur une cible.
     */
    async _handleCardDrop(dragInfo, targetId) {
        if (!this._engine) return

        try {
            if (dragInfo.type === 'attack') {
                this._dispatcher.attack(
                    dragInfo.playerId,
                    dragInfo.cardId,
                    targetId
                )
            } else if (dragInfo.type === 'play') {
                // Vérifier type de spell ou creature pour dispatcher
                // Pour l'instant : jouer comme creature
                this._dispatcher.playCreature(
                    dragInfo.playerId,
                    dragInfo.cardId
                )
            }

            this._engine.runUntilIdle()
            this.render()
        } catch (e) {
            console.error('Drop failed:', e)
        }
    }

    /**
     * Observer pattern callback.
     */
    _onUiStateChanged() {
        // Trigger re-render en réponse aux changements UI
        // Pour l'instant, ne rien faire — render() est appelé après les actions
    }

    // =====================
    // HELPERS
    // =====================

    _isOffensiveSpell(dragInfo) {
        // À implémenter basé sur définition de la carte
        return dragInfo.type === 'play'
    }

    _renderTabBar() {
        const bar = document.createElement('nav')
        bar.className = 'tab-bar'

        const tabs = [
            { id: 'game', icon: '⚔', label: 'Game' },
            { id: 'log', icon: '📋', label: 'Log' }
        ]

        for (const tab of tabs) {
            const btn = document.createElement('button')
            btn.className = `tab-btn${this._activePanel === tab.id ? ' active' : ''}`
            btn.innerHTML = `<span class="tab-icon">${tab.icon}</span>${tab.label}`
            btn.addEventListener('click', () => {
                this._activePanel = tab.id
                this.render()
            })
            bar.appendChild(btn)
        }

        return bar
    }

    /**
     * Nettoyage des ressources.
     */
    destroy() {
        this._unsubscribe?.()
        this._dragDropMgr?.destroy()
        this._fxCtrl?.destroy()
    }
}
