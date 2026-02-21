import './gameplay/ui/styles.scss'
import UiAdapter from './gameplay/ui/UiAdapter.js'

const ui = new UiAdapter(document.querySelector('#app'))
ui.start()
