export class UrlNavigation {
  url: string
  openInApp: boolean

  constructor (url: string, openInApp: boolean) {
    this.url = url
    this.openInApp = openInApp
  }
}
