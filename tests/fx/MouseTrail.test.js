/**
 * Tests MouseTrail — shape rendering, preset validation, configuration.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import MouseTrail from '../../src/fx/MouseTrail.js'

/**
 * Mock minimal d'un CanvasRenderingContext2D.
 * Enregistre les appels pour vérification.
 */
function createMockCtx() {
    const calls = []
    const record = (name) => (...args) => calls.push({ name, args })
    const gradientStub = { addColorStop: record('addColorStop') }

    return {
        calls,
        beginPath: record('beginPath'),
        arc: record('arc'),
        rect: record('rect'),
        moveTo: record('moveTo'),
        lineTo: record('lineTo'),
        closePath: record('closePath'),
        fill: record('fill'),
        stroke: record('stroke'),
        quadraticCurveTo: record('quadraticCurveTo'),
        createRadialGradient: (...args) => {
            calls.push({ name: 'createRadialGradient', args })
            return gradientStub
        },
        createLinearGradient: (...args) => {
            calls.push({ name: 'createLinearGradient', args })
            return gradientStub
        },
        set fillStyle(_v) { calls.push({ name: 'set_fillStyle' }) },
        set strokeStyle(_v) { calls.push({ name: 'set_strokeStyle' }) },
        set lineWidth(_v) { calls.push({ name: 'set_lineWidth' }) },
        set lineCap(_v) { calls.push({ name: 'set_lineCap' }) },
        set lineJoin(_v) { calls.push({ name: 'set_lineJoin' }) }
    }
}

// =====================
// CONFIGURATION / SHAPE
// =====================

describe('MouseTrail — shape configuration', () => {
    beforeEach(() => {
        MouseTrail.resetPresets()
    })

    it('defaults to circle shape', () => {
        const trail = new MouseTrail({ colors: ['#ff0000'] })
        expect(trail._shape).toBe('circle')
    })

    it('accepts a custom shape via options', () => {
        const trail = new MouseTrail({ colors: ['#ff0000'], shape: 'star' })
        expect(trail._shape).toBe('star')
    })

    it('reads shape from preset', () => {
        const trail = new MouseTrail('MAGIC')
        expect(trail._shape).toBe('star')
    })

    it('allows preset override of shape', () => {
        const trail = new MouseTrail({ preset: 'MAGIC', shape: 'diamond' })
        expect(trail._shape).toBe('diamond')
    })

    it('defaults to circle when preset has no shape', () => {
        const trail = new MouseTrail('AURORA')
        expect(trail._shape).toBe('circle')
    })
})

// =====================
// PRESET VALIDATION
// =====================

describe('MouseTrail — shape validation', () => {
    beforeEach(() => {
        MouseTrail.resetPresets()
    })

    it('rejects invalid shape in loadPresetsFromJSON', () => {
        const result = MouseTrail.loadPresetsFromJSON({
            presets: {
                BAD: { colors: ['#ff0000'], shape: 'hexagon' }
            }
        })
        expect(result.errors.length).toBe(1)
        expect(result.errors[0]).toContain('shape')
        expect(result.added).not.toContain('BAD')
    })

    it('accepts valid shape in loadPresetsFromJSON', () => {
        const result = MouseTrail.loadPresetsFromJSON({
            presets: {
                GOOD: { colors: ['#ff0000'], shape: 'triangle' }
            }
        })
        expect(result.errors.length).toBe(0)
        expect(result.added).toContain('GOOD')
    })

    it('accepts preset without shape field', () => {
        const result = MouseTrail.loadPresetsFromJSON({
            presets: {
                NOSHAPE: { colors: ['#ff0000'] }
            }
        })
        expect(result.errors.length).toBe(0)
        expect(result.added).toContain('NOSHAPE')
    })
})

// =====================
// RENDERING — SHAPES
// =====================

describe('MouseTrail — shape rendering', () => {
    /**
     * Crée un trail avec la forme donnée, ajoute un point, et dessine.
     * Retourne les appels enregistrés sur le mock ctx.
     */
    function drawWithShape(shape) {
        const trail = new MouseTrail({
            colors: ['#ff0000'],
            shape,
            glow: false,
            ribbon: false,
            sparklesPerPoint: 0
        })
        trail.addPoint(100, 100)
        const ctx = createMockCtx()
        trail.draw(ctx)
        return ctx.calls
    }

    it('circle shape uses ctx.arc', () => {
        const calls = drawWithShape('circle')
        const arcCalls = calls.filter(c => c.name === 'arc')
        expect(arcCalls.length).toBeGreaterThan(0)
    })

    it('square shape uses ctx.rect', () => {
        const calls = drawWithShape('square')
        const rectCalls = calls.filter(c => c.name === 'rect')
        expect(rectCalls.length).toBeGreaterThan(0)
        expect(calls.filter(c => c.name === 'arc').length).toBe(0)
    })

    it('diamond shape uses moveTo/lineTo/closePath', () => {
        const calls = drawWithShape('diamond')
        const moveToCount = calls.filter(c => c.name === 'moveTo').length
        const lineToCount = calls.filter(c => c.name === 'lineTo').length
        const closeCount = calls.filter(c => c.name === 'closePath').length
        expect(moveToCount).toBeGreaterThan(0)
        expect(lineToCount).toBe(3)
        expect(closeCount).toBeGreaterThan(0)
    })

    it('triangle shape uses moveTo/lineTo/closePath', () => {
        const calls = drawWithShape('triangle')
        const moveToCount = calls.filter(c => c.name === 'moveTo').length
        const lineToCount = calls.filter(c => c.name === 'lineTo').length
        expect(moveToCount).toBeGreaterThan(0)
        expect(lineToCount).toBe(2)
    })

    it('star shape uses moveTo + 9 lineTo + closePath', () => {
        const calls = drawWithShape('star')
        const moveToCount = calls.filter(c => c.name === 'moveTo').length
        const lineToCount = calls.filter(c => c.name === 'lineTo').length
        expect(moveToCount).toBeGreaterThan(0)
        expect(lineToCount).toBe(9)
    })
})

// =====================
// EXPORT / ROUND-TRIP
// =====================

describe('MouseTrail — shape in export/import', () => {
    beforeEach(() => {
        MouseTrail.resetPresets()
    })

    it('exports shape field from presets', () => {
        const exported = MouseTrail.exportPresets()
        expect(exported.presets.MAGIC.shape).toBe('star')
        expect(exported.presets.CRYSTAL.shape).toBe('diamond')
    })

    it('round-trips shape through export/import', () => {
        const exported = MouseTrail.exportPresets()
        MouseTrail.resetPresets()
        const result = MouseTrail.loadPresetsFromJSON(exported)
        expect(result.errors.length).toBe(0)
        expect(MouseTrail.getPreset('MAGIC').shape).toBe('star')
    })
})
