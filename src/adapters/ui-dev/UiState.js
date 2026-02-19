/**
 * UiState — source unique de vérité pour l'état de l'UI.
 *
 * Centralise tout le state local (pas le state du jeu, mais l'état d'interaction).
 * Permet une séparation claire entre logique métier et présentation.
 */

export default class UiState {
    /**
     * @param {Object} options
     */
    constructor(options = {}) {
        // Drag & drop
        this.dragState = null              // {cardId, playerId, action, cardType, effect}
        this.inputState = null             // {source, el, dragInfo, startX, startY, active, ghost, ...}
        this.dropTargets = []              // [{el, highlightAttr, acceptFn, dropFn}, ...]

        // Animations
        this.landingCardId = null          // ID de la carte en vol (pour fade in/out)

        // Navigation
        this.activePanel = 'game'          // 'game' | 'log'

        // Logging
        this.eventLog = []
        this.maxLogSize = options.maxLogSize ?? 50

        // Listeners pour les changements
        this._listeners = new Map()
    }

    /**
     * S'abonne aux changements d'un champ.
     *
     * @param {string} field - Champ observé
     * @param {Function} callback - (newValue) => void
     * @returns {Function} Fonction de désinscription
     */
    subscribe(field, callback) {
        if (!this._listeners.has(field)) {
            this._listeners.set(field, [])
        }
        this._listeners.get(field).push(callback)

        return () => {
            const list = this._listeners.get(field)
            const idx = list.indexOf(callback)
            if (idx !== -1) list.splice(idx, 1)
        }
    }

    /**
     * Notifie les listeners d'un changement.
     *
     * @param {string} field
     * @param {*} newValue
     */
    _notify(field, newValue) {
        const list = this._listeners.get(field)
        if (list) {
            for (const cb of list) {
                cb(newValue)
            }
        }
    }

    // =====================
    // DRAG & DROP
    // =====================

    setDragState(dragInfo) {
        this.dragState = dragInfo
        this._notify('dragState', dragInfo)
    }

    clearDragState() {
        this.dragState = null
        this._notify('dragState', null)
    }

    setInputState(inputState) {
        this.inputState = inputState
        this._notify('inputState', inputState)
    }

    clearInputState() {
        this.inputState = null
        this._notify('inputState', null)
    }

    setDropTargets(targets) {
        this.dropTargets = targets
        this._notify('dropTargets', targets)
    }

    // =====================
    // ANIMATIONS
    // =====================

    setLandingCardId(cardId) {
        this.landingCardId = cardId
        this._notify('landingCardId', cardId)
    }

    clearLandingCardId() {
        this.landingCardId = null
        this._notify('landingCardId', null)
    }

    // =====================
    // NAVIGATION
    // =====================

    setActivePanel(panel) {
        this.activePanel = panel
        this._notify('activePanel', panel)
    }

    // =====================
    // LOGGING
    // =====================

    addLogEntry(text) {
        this.eventLog.push({ text })
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize)
        }
        this._notify('eventLog', this.eventLog)
    }

    clearLog() {
        this.eventLog = []
        this._notify('eventLog', [])
    }

    // =====================
    // RESET
    // =====================

    reset() {
        this.dragState = null
        this.inputState = null
        this.dropTargets = []
        this.landingCardId = null
        this.eventLog = []
        this._notify('reset', true)
    }
}
