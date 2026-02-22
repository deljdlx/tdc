/**
 * Kit UI — fonctions HTML reutilisables pour les ecrans.
 *
 * Chaque fonction retourne une chaine HTML. Les classes CSS
 * correspondantes sont dans styles.scss (section UI KIT).
 */

/**
 * Layout d'ecran avec header optionnel (titre + bouton retour).
 *
 * @param {string} title
 * @param {string} content - HTML du corps
 * @param {Object} [opts]
 * @param {boolean} [opts.backButton=true]
 */
export function screenLayout(title, content, { backButton = true } = {}) {
    const back = backButton
        ? '<button class="screen-back-btn">Back</button>'
        : ''

    return `
        <div class="screen">
            <div class="screen-header">
                ${back}
                <h1 class="screen-title">${title}</h1>
            </div>
            ${content}
        </div>
    `
}

/**
 * Grille responsive d'elements.
 *
 * @param {string} items - HTML des elements concatenes
 * @param {Object} [opts]
 * @param {string} [opts.minWidth='160px'] - largeur min des colonnes
 */
export function grid(items, { minWidth = '160px' } = {}) {
    return `<div class="screen-grid" style="--grid-min:${minWidth}">${items}</div>`
}

/**
 * Carte generique avec hover.
 *
 * @param {string} content - HTML interne
 * @param {string} [extraClass=''] - classes supplementaires
 */
export function card(content, extraClass = '') {
    const cls = extraClass ? `card ${extraClass}` : 'card'
    return `<div class="${cls}">${content}</div>`
}

/**
 * Badge de stat colore.
 *
 * @param {number|string} value
 * @param {string} variant - power | hp | speed | ap | mana
 * @param {string} [title='']
 */
export function statBadge(value, variant, title = '') {
    const attr = title ? ` title="${title}"` : ''
    return `<span class="stat-badge stat-badge--${variant}"${attr}>${value}</span>`
}

/**
 * Bouton primaire.
 *
 * @param {string} label
 * @param {string} [className='']
 */
export function primaryBtn(label, className = '') {
    const cls = className ? `ui-btn ui-btn--primary ${className}` : 'ui-btn ui-btn--primary'
    return `<button class="${cls}">${label}</button>`
}

/**
 * Bouton secondaire (bordure, fond transparent).
 *
 * @param {string} label
 * @param {string} [className='']
 */
export function secondaryBtn(label, className = '') {
    const cls = className ? `ui-btn ui-btn--secondary ${className}` : 'ui-btn ui-btn--secondary'
    return `<button class="${cls}">${label}</button>`
}
