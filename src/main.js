import './gameplay/ui/styles.scss'
import Router from './screens/Router.js'
import SplashScreen from './screens/SplashScreen.js'
import HomeScreen from './screens/HomeScreen.js'
import GameScreen from './screens/GameScreen.js'
import HeroesScreen from './screens/HeroesScreen.js'

const root = document.querySelector('#app')
const router = new Router(root)

router.register('splash', new SplashScreen(router))
router.register('home', new HomeScreen(router))
router.register('game', new GameScreen())
router.register('heroes', new HeroesScreen(router))

router.navigate('splash')
