import { boot } from 'quasar/wrappers'
import store, { key } from '../store/index'

export default boot(({ app }) => {
  app.use(store, key)
})
