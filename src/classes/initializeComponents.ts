export class InitializeComponents {
  main = true
  siteState = true

  constructor (initialized = false) {
    this.main = initialized
    this.siteState = initialized
  }
}
