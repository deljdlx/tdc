/**
 * CommandGraphRenderer — rendu du graphe de commandes avec Cytoscape.js.
 *
 * Responsabilite unique : initialiser et afficher le graphe dagre
 * dans un conteneur DOM fourni.
 */

import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { NODES, EDGES, CATEGORY } from './commandGraphData.js'

cytoscape.use(dagre)

/** Couleurs par categorie de noeud. */
const CATEGORY_COLORS = {
    [CATEGORY.GAME_FLOW]: '#00aaff',
    [CATEGORY.PLAYER_ACTION]: '#ffcc00',
    [CATEGORY.EFFECT]: '#a78bfa',
    [CATEGORY.TERMINAL]: '#e94560'
}

export default class CommandGraphRenderer {
    /** @type {import('cytoscape').Core|null} */
    _cy = null

    /**
     * Rend le graphe dans le conteneur fourni.
     * @param {HTMLElement} container
     */
    render(container) {
        this.destroy()
        this._cy = cytoscape({
            container,
            elements: [...NODES, ...EDGES],
            layout: {
                name: 'dagre',
                rankDir: 'TB',
                nodeSep: 80,
                rankSep: 100,
                edgeSep: 30,
                animate: false,
                fit: true,
                padding: 20
            },
            style: this._buildStyle(),
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            autoungrabify: true
        })
    }

    /** Detruit l'instance Cytoscape proprement. */
    destroy() {
        if (this._cy) {
            this._cy.destroy()
            this._cy = null
        }
    }

    /** @returns {Array} Style Cytoscape pour noeuds et aretes. */
    _buildStyle() {
        return [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '11px',
                    'color': '#ffffff',
                    'text-outline-color': '#1a1a1a',
                    'text-outline-width': 2,
                    'width': 110,
                    'height': 40,
                    'shape': 'round-rectangle',
                    'border-width': 2,
                    'border-color': '#4a4a4a'
                }
            },
            ...this._categorySelectors(),
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#6a6a6a',
                    'target-arrow-color': '#6a6a6a',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '9px',
                    'color': '#a0a0a0',
                    'text-rotation': 'autorotate',
                    'text-outline-color': '#1a1a1a',
                    'text-outline-width': 1.5
                }
            },
            {
                selector: 'edge[?conditional]',
                style: {
                    'line-style': 'dashed',
                    'line-dash-pattern': [6, 3],
                    'line-color': '#e9456080',
                    'target-arrow-color': '#e9456080'
                }
            }
        ]
    }

    /** @returns {Array} Selecteurs de couleur par categorie. */
    _categorySelectors() {
        return Object.entries(CATEGORY_COLORS).map(([cat, color]) => ({
            selector: `node[category = "${cat}"]`,
            style: { 'background-color': color }
        }))
    }
}
