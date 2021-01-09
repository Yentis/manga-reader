import { SortType } from 'src/enums/sortingEnum'
import { RefreshOptions } from './refreshOptions'

export class Settings {
  openInBrowser: boolean
  darkMode: boolean
  refreshOptions: RefreshOptions
  sortedBy: SortType

  constructor (openInBrowser = false, darkMode = false, refreshOptions = new RefreshOptions(), sortedBy = SortType.TITLE) {
    this.openInBrowser = openInBrowser
    this.darkMode = darkMode
    this.refreshOptions = new RefreshOptions(refreshOptions.enabled, refreshOptions.period)
    this.sortedBy = sortedBy
  }

  equals (settings: Settings) {
    return this.openInBrowser === settings.openInBrowser &&
           this.darkMode === settings.darkMode &&
           this.refreshOptions.equals(settings.refreshOptions) &&
           this.sortedBy === settings.sortedBy
  }

  static clone (settings: Settings) {
    return new Settings(
      settings.openInBrowser,
      settings.darkMode,
      new RefreshOptions(
        settings.refreshOptions.enabled,
        settings.refreshOptions.period
      ),
      settings.sortedBy
    )
  }
}
