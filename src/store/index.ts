import { InjectionKey } from 'vue'
import { createStore, Store, useStore as baseUseStore } from 'vuex'
import reader, { ReaderState } from './store-reader'
import initialized, { InitializedState } from './store-initialized'

export interface State {
  reader: ReaderState,
  initialized: InitializedState
}

export const key: InjectionKey<Store<State>> = Symbol('vuex-key')

export default createStore<State>({
  modules: {
    reader,
    initialized
  },

  strict: process.env.DEV?.toString() === 'true'
})

export function useStore () {
  return baseUseStore(key)
}
