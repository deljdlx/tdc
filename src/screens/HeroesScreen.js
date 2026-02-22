/**
 * HeroesScreen — liste des heros du jeu.
 *
 * Affiche une grille de cartes hero avec portrait et stats.
 * Ecran de consultation pour le moment, les fonctionnalites
 * (selection, personnalisation) viendront ensuite.
 */

import { HERO_DEFINITIONS } from '../gameplay/definitions/heroes.js'
import { screenLayout, grid, card, statBadge } from '../ui/kit.js'

const PICSUM = 'https://picsum.photos/seed'

export default class HeroesScreen {
    constructor(router) {
        this._router = router
    }

    mount(root) {
        const cards = HERO_DEFINITIONS
            .map(h => this._heroCard(h))
            .join('')

        const count = `<div class="screen-count">${HERO_DEFINITIONS.length} heroes</div>`

        root.innerHTML = screenLayout(
            'Heroes',
            count + grid(cards),
            { subtitle: 'Your champions await' }
        )

        root.querySelector('.js-back')
            .addEventListener('click', () => this._router.navigate('home'))
    }

    unmount() {
        // Pas de ressources a nettoyer
    }

    _heroCard(hero) {
        return card(`
            <div class="hero-portrait"
                 style="background-image:url(${PICSUM}/${hero.id}/120/120)">
            </div>
            <div class="hero-name">${hero.name}</div>
            <div class="hero-stats">
                ${statBadge(hero.power, 'power', 'Power')}
                ${statBadge(hero.hp, 'hp', 'HP')}
                ${statBadge(hero.speed, 'speed', 'Speed')}
                ${statBadge(hero.maxAp, 'ap', 'Action Points')}
                ${statBadge(hero.maxMana, 'mana', 'Mana')}
            </div>
        `, 'hero-card')
    }
}
