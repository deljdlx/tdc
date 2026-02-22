/**
 * HeroesScreen — liste des heros du jeu.
 *
 * Affiche une grille de cartes hero avec portrait et stats.
 * Ecran de consultation pour le moment, les fonctionnalites
 * (selection, personnalisation) viendront ensuite.
 */

import { HERO_DEFINITIONS } from '../gameplay/definitions/heroes.js'

const PICSUM = 'https://picsum.photos/seed'

export default class HeroesScreen {
    constructor(router) {
        this._router = router
    }

    mount(root) {
        const cards = HERO_DEFINITIONS
            .map(h => this._heroCard(h))
            .join('')

        root.innerHTML = `
            <div class="heroes-screen">
                <div class="heroes-header">
                    <button class="heroes-back-btn">Back</button>
                    <h1 class="heroes-title">Heroes</h1>
                </div>
                <div class="heroes-grid">${cards}</div>
            </div>
        `

        root.querySelector('.heroes-back-btn')
            .addEventListener('click', () => this._router.navigate('home'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }

    _heroCard(hero) {
        return `
            <div class="hero-card">
                <div class="hero-portrait"
                     style="background-image:url(${PICSUM}/${hero.id}/120/120)">
                </div>
                <div class="hero-name">${hero.name}</div>
                <div class="hero-stats">
                    <span class="hero-stat hero-stat--power"
                          title="Power">${hero.power}</span>
                    <span class="hero-stat hero-stat--hp"
                          title="HP">${hero.hp}</span>
                    <span class="hero-stat hero-stat--speed"
                          title="Speed">${hero.speed}</span>
                    <span class="hero-stat hero-stat--ap"
                          title="Action Points">${hero.maxAp}</span>
                    <span class="hero-stat hero-stat--mana"
                          title="Mana">${hero.maxMana}</span>
                </div>
            </div>
        `
    }
}
