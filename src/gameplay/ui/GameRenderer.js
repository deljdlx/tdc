/**
 * GameRenderer — rendu pur du jeu. Pas d'effets secondaires.
 *
 * Expose des fonctions pour créer des éléments UI sans état.
 * Permet de réutiliser le rendu même quand on change la logique.
 */

import { getCardDefinition } from '../definitions/cards.js'

export default class GameRenderer {
    /**
     * Crée l'UI complète du jeu.
     *
     * @param {Object} state - State du moteur
     * @param {Object} _uiState - État de l'UI
     * @returns {HTMLElement} Div panel
     */
    renderGame(state, _uiState) {
        const panel = document.createElement('div')
        panel.className = 'panel active'

        // Controls
        panel.appendChild(this.renderControls(state))

        // Status bar
        panel.appendChild(this.renderStatusBar(state))

        // Game board
        const board = document.createElement('div')
        board.className = 'game-board'

        const playerIds = Object.keys(state.players)
        board.appendChild(this.renderPlayerArea(state, playerIds[1], true))
        board.appendChild(this.renderPlayerArea(state, playerIds[0], false))

        panel.appendChild(board)
        return panel
    }

    /**
     * Rend les controls (End Turn, etc).
     */
    renderControls(state) {
        const bar = document.createElement('div')
        bar.className = 'controls'

        const endTurnBtn = document.createElement('button')
        endTurnBtn.className = 'btn btn-primary'
        endTurnBtn.setAttribute('data-action', 'end-turn')
        endTurnBtn.textContent = 'End Turn'
        endTurnBtn.disabled = state.turnState.phase === 'game_over'

        const newGameBtn = document.createElement('button')
        newGameBtn.className = 'btn btn-secondary'
        newGameBtn.setAttribute('data-action', 'new-game')
        newGameBtn.textContent = 'New Game'

        const replayBtn = document.createElement('button')
        replayBtn.className = 'btn btn-secondary'
        replayBtn.setAttribute('data-action', 'replay')
        replayBtn.textContent = 'Replay'

        bar.append(endTurnBtn, newGameBtn, replayBtn)
        return bar
    }

    /**
     * Rend la status bar (tour, joueur actif, phase).
     */
    renderStatusBar(state) {
        const bar = document.createElement('div')
        bar.className = 'status-bar'
        bar.innerHTML = `
            <span>Turn ${state.turnState.turnNumber}</span>
            <span>Active: <strong>${state.turnState.activePlayerId}</strong></span>
            <span>Phase: ${state.turnState.phase}</span>
        `
        return bar
    }

    /**
     * Rend une zone joueur (HUD + board + hand).
     *
     * @param {Object} state
     * @param {string} playerId
     * @param {boolean} mirrored
     */
    renderPlayerArea(state, playerId, mirrored) {
        const player = state.players[playerId]
        const isActive = playerId === state.turnState.activePlayerId
        const isGameOver = state.turnState.phase === 'game_over'

        const hud = document.createElement('player-hud')
        hud.setAttribute('data-player-id', playerId)
        hud.setAttribute('name', playerId)
        if (mirrored) hud.setAttribute('mirrored', '')
        hud.setAttribute('mana', player.attributes.mana ?? 0)
        hud.setAttribute('max-mana', player.attributes.maxMana ?? 0)
        hud.setAttribute('deck-count', this._cardsInZone(state, `deck_${playerId}`).length)
        hud.setAttribute('grave-count', this._cardsInZone(state, `graveyard_${playerId}`).length)
        if (isActive) hud.setAttribute('active', '')

        // Board zone (heroes)
        const boardZone = document.createElement('card-zone')
        boardZone.setAttribute('type', 'board')

        const heroes = state.heroes
            ? Object.values(state.heroes).filter(h => h.playerId === playerId)
            : []
        for (const hero of heroes) {
            boardZone.appendChild(this._renderHero(hero, isActive, isGameOver))
        }
        hud.appendChild(boardZone)

        // Hand zone (si joueur actif)
        if (isActive) {
            const handZone = document.createElement('card-zone')
            handZone.setAttribute('type', 'hand')
            handZone.setAttribute('data-zone-id', `hand_${playerId}`)

            for (const card of this._cardsInZone(state, `hand_${playerId}`)) {
                handZone.appendChild(this._renderHandCard(card, playerId, state))
            }
            hud.appendChild(handZone)
        }

        return hud
    }

    /**
     * Rend un hero sur le board.
     */
    _renderHero(hero, isActive, isGameOver) {
        const el = document.createElement('tcg-card')

        el.setAttribute('data-card-id', hero.id)
        el.setAttribute('definition-id', hero.heroDefId)
        el.setAttribute('name', hero.heroDefId)
        el.setAttribute('type', 'hero')
        el.setAttribute('power', hero.attributes.power)
        el.setAttribute('hp', hero.attributes.hp)
        if (hero.attributes.hasAttacked) el.setAttribute('has-attacked', '')

        const canAttack = isActive && !hero.attributes.hasAttacked && !isGameOver
        if (canAttack) {
            el.setAttribute('can-attack', '')
            el.setAttribute('draggable', 'true')
            el.setAttribute('data-drag-action', 'attack')
        }

        return el
    }

    /**
     * Rend une carte en main.
     */
    _renderHandCard(card, playerId, state) {
        const def = getCardDefinition(card.definitionId)
        const el = document.createElement('tcg-card')
        const mana = state.players[playerId].attributes.mana
        const canPlay = card.attributes.cost <= mana && state.turnState.phase !== 'game_over'

        el.setAttribute('data-card-id', card.id)
        el.setAttribute('definition-id', card.definitionId)
        el.setAttribute('name', def?.name ?? card.definitionId)
        el.setAttribute('cost', card.attributes.cost)
        el.setAttribute('type', card.attributes.type)

        const effectText = this._formatEffectText(card.attributes.effect, def)
        el.setAttribute('effect', effectText)

        if (canPlay) {
            el.setAttribute('playable', '')
            el.setAttribute('draggable', 'true')
            el.setAttribute('data-drag-action', 'play')
        }

        return el
    }

    /**
     * Formatte le texte d'effet.
     */
    _formatEffectText(effect, def) {
        const EFFECT_TEXT = {
            DEAL_DAMAGE: (v) => `Deal ${v} damage`,
            RESTORE_HP: (v) => `Restore ${v} HP`
        }

        const formatter = EFFECT_TEXT[effect]
        if (!formatter) return effect

        const effectValue = def?.effectPayload?.amount ?? def?.effectValue ?? '?'
        return formatter(effectValue)
    }

    /**
     * Retrouve les cartes dans une zone.
     */
    _cardsInZone(state, zoneId) {
        return Object.values(state.cards).filter(c => c.zoneId === zoneId)
    }

    /**
     * Rend le panel d'événements.
     */
    renderEventLog(eventLog) {
        const container = document.createElement('div')
        container.className = 'panel'

        const title = document.createElement('div')
        title.className = 'log-title'
        title.textContent = 'Event Log'
        container.appendChild(title)

        const list = document.createElement('div')
        list.className = 'log-list'

        const recent = eventLog.slice(-50)
        for (const entry of recent) {
            const line = document.createElement('div')
            line.className = 'log-entry'
            line.textContent = entry.text
            list.appendChild(line)
        }

        container.appendChild(list)
        list.scrollTop = list.scrollHeight
        return container
    }

    /**
     * Rend la tab bar.
     */
    renderTabBar() {
        const bar = document.createElement('nav')
        bar.className = 'tab-bar'

        const tabs = [
            { id: 'game', icon: '⚔', label: 'Game' },
            { id: 'log', icon: '📋', label: 'Log' }
        ]

        for (const tab of tabs) {
            const btn = document.createElement('button')
            btn.className = 'tab-btn'
            btn.setAttribute('data-tab', tab.id)
            btn.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-label">${tab.label}</span>`
            bar.appendChild(btn)
        }

        return bar
    }
}
