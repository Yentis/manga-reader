import Vue from 'vue'
import Vuex from 'vuex'

import reader from './store-reader'

Vue.use(Vuex)

const Store = new Vuex.Store({
  modules: {
    reader
  },

  strict: process.env.DEV === 'true'
})

export default function () {
  return Store
}
