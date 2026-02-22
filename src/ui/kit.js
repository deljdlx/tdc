/**
 * Kit UI — fonctions HTML reutilisables pour les ecrans.
 *
 * Chaque fonction retourne une chaine HTML. Les classes CSS
 * correspondantes sont dans styles.scss (section UI KIT).
 *
 * Le template uniforme utilise des CSS custom properties
 * (prefixees --theme-) pour un skinning facile.
 */

/**
 * Cadre decoratif d'ecran avec double bordure et coins ornementes.
 * Skinnable via les custom properties --frame-* sur :root.
 *
 * @param {string} content - HTML du contenu encadre
 */
export function frame(content) {
    return `
        <div class="screen-frame">
            <div class="screen-frame-corners">
                <span class="screen-frame-corner"></span>
                <span class="screen-frame-corner"></span>
                <span class="screen-frame-corner"></span>
                <span class="screen-frame-corner"></span>
            </div>
            <div class="screen-frame-content">
                ${content}
            </div>
        </div>
    `
}

/**
 * Ornement decoratif horizontal (losange + lignes).
 */
export function ornament() {
    return `
        <div class="screen-ornament">
            <span class="screen-ornament-diamond"></span>
        </div>
    `
}

/**
 * Barre de navigation commune a tous les ecrans.
 *
 * @param {string} title - Titre de l'ecran
 * @param {Object} [opts]
 * @param {boolean} [opts.backButton=true]
 */
export function navBar(title, { backButton = true } = {}) {
    const back = backButton
        ? '<button class="screen-nav-back js-back">Back</button>'
        : ''

    return `
        <nav class="screen-nav">
            ${back}
            <div class="screen-nav-brand">
                <span class="screen-nav-logo">TGC</span>
                <span class="screen-nav-sep"></span>
                <span class="screen-nav-title">${title}</span>
            </div>
        </nav>
    `
}

/**
 * Section hero decorative (bandeau sous la nav).
 *
 * @param {string} title
 * @param {string} [subtitle='']
 */
export function heroSection(title, subtitle = '') {
    const sub = subtitle
        ? `<div class="screen-hero-subtitle">${subtitle}</div>`
        : ''

    return `
        <div class="screen-hero">
            <div class="screen-hero-title">${title}</div>
            ${sub}
            ${ornament()}
        </div>
    `
}

/**
 * Layout d'ecran uniforme : nav + hero + body.
 *
 * @param {string} title
 * @param {string} content - HTML du corps
 * @param {Object} [opts]
 * @param {boolean} [opts.backButton=true]
 * @param {string} [opts.subtitle='']
 */
export function screenLayout(title, content, { backButton = true, subtitle = '' } = {}) {
    return frame(`
        <div class="screen">
            ${navBar(title, { backButton })}
            ${heroSection(title, subtitle)}
            <div class="screen-body">
                ${content}
            </div>
        </div>
    `)
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
