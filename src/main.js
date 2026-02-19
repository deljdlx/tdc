import './adapters/ui-dev/styles.scss'
import UiAdapter from './adapters/ui-dev/UiAdapter.js'

const ui = new UiAdapter(document.querySelector('#app'))
ui.start()
