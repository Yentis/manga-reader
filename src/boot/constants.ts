import { Constants } from 'src/classes/constants'
import Vue from 'vue'

const constants = new Constants()

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
Vue.prototype.$constants = constants

export default function () {
  return constants
}
