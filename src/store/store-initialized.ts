export class InitializedState {
  main = false
  siteState = false
}

const state = new InitializedState()

const mutations = {
  updateMain (state: InitializedState, main: boolean) {
    state.main = main
  },
  updateSiteState (state: InitializedState, siteState: boolean) {
    state.siteState = siteState
  }
}

const getters = {
  main: (state: InitializedState) => {
    return state.main
  },
  siteState: (state: InitializedState) => {
    return state.siteState
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
