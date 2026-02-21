/**
 * CommandGraphRenderer — rendu du graphe de commandes avec Cytoscape.js.
 *
 * Responsabilite unique : initialiser et afficher le graphe dagre
 * dans un conteneur DOM fourni.
 */

import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { NODES, EDGES, CATEGORY, CATEGORY_COLORS } from './commandGraphData.js'

cytoscape.use(dagre)

/** Bordures plus foncees par categorie, pour donner du relief. */
const CATEGORY_BORDER_COLORS = {
    [CATEGORY.GAME_FLOW]: '#5889B0',
    [CATEGORY.PLAYER_ACTION]: '#D4960A',
    [CATEGORY.EFFECT]: '#7A64B8',
    [CATEGORY.TERMINAL]: '#C43850'
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
                padding: 30
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
                    'font-weight': '600',
                    'font-family': "'Inter', 'Segoe UI', system-ui, sans-serif",
                    'color': '#ffffff',
                    'text-outline-width': 2,
                    'text-outline-opacity': 0.5,
                    'width': 130,
                    'height': 44,
                    'shape': 'round-rectangle',
                    'border-width': 2,
                    'background-opacity': 0.92,
                    'shadow-blur': 4,
                    'shadow-offset-x': 0,
                    'shadow-offset-y': 1,
                    'shadow-opacity': 0.12
                }
            },
            ...this._categorySelectors(),
            {
                selector: 'edge',
                style: {
                    'width': 1.5,
                    'line-color': '#B8C9B8',
                    'target-arrow-color': '#7BAF7A',
                    'target-arrow-shape': 'triangle',
                    'arrow-scale': 0.9,
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '8px',
                    'font-family': "'Inter', 'Segoe UI', system-ui, sans-serif",
                    'color': '#5B8C5A',
                    'text-rotation': 'autorotate',
                    'text-background-color': '#F5F3EF',
                    'text-background-opacity': 0.85,
                    'text-background-shape': 'roundrectangle',
                    'text-background-padding': '3px'
                }
            },
            {
                selector: 'edge[?conditional]',
                style: {
                    'line-style': 'dashed',
                    'line-dash-pattern': [6, 4],
                    'line-color': '#E8927C',
                    'target-arrow-color': '#C46E58',
                    'color': '#C46E58'
                }
            }
        ]
    }

    /** @returns {Array} Selecteurs de couleur et relief par categorie. */
    _categorySelectors() {
        return Object.entries(CATEGORY_COLORS).flatMap(([cat, color]) => {
            const borderColor = CATEGORY_BORDER_COLORS[cat]
            const isLight = cat === CATEGORY.PLAYER_ACTION
            return [{
                selector: `node[category = "${cat}"]`,
                style: {
                    'background-color': color,
                    'border-color': borderColor,
                    'text-outline-color': borderColor,
                    ...(isLight ? { 'color': '#3a3000', 'text-outline-color': '#f5e6b8' } : {})
                }
            }]
        })
    }
}
