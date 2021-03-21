import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { RefreshOptions } from 'src/classes/refreshOptions'
import { Settings } from 'src/classes/settings'
import { SiteType } from 'src/enums/siteEnum'
import { Status } from 'src/enums/statusEnum'
import { version } from '../../package.json'

const OPEN_BROWSER_KEY = 'open_browser'
const DARK_MODE_KEY = 'dark_mode'
const REFRESH_OPTIONS_KEY = 'refresh_options'

interface MigrationManga {
  mangaDexId: number | undefined
  linkedSites: Record<string, number> | undefined
  completed: boolean | undefined
  status: Status | undefined
  site: string
}

export function getMigrationVersion () {
  return LocalStorage.getItem(constants().MIGRATION_VERSION) || ''
}

export function tryMigrateMangaList () {
  if (getMigrationVersion() === version) return
  const mangaList: MigrationManga[] | null = LocalStorage.getItem(constants().MANGA_LIST_KEY)

  if (mangaList !== null) {
    LocalStorage.set(constants().MANGA_LIST_KEY, doMigration(mangaList))
  }
}

export function tryMigrateSettings () {
  if (getMigrationVersion() === version) return
  const settings: Settings = LocalStorage.getItem(constants().SETTINGS) || new Settings()
  const openInBrowser: boolean | null = LocalStorage.getItem(OPEN_BROWSER_KEY)
  const darkMode: boolean | null = LocalStorage.getItem(DARK_MODE_KEY)
  const refreshOptions: RefreshOptions | null = LocalStorage.getItem(REFRESH_OPTIONS_KEY)

  if (openInBrowser !== null) {
    settings.openInBrowser = openInBrowser
    LocalStorage.remove(OPEN_BROWSER_KEY)
  }

  if (darkMode !== null) {
    settings.darkMode = darkMode
    LocalStorage.remove(DARK_MODE_KEY)
  }

  if (refreshOptions !== null) {
    settings.refreshOptions = refreshOptions
    LocalStorage.remove(REFRESH_OPTIONS_KEY)
  }

  LocalStorage.set(constants().SETTINGS, settings)
}

export function migrateInput (input: string): string {
  const mangaList = JSON.parse(input) as MigrationManga[]
  return JSON.stringify(doMigration(mangaList))
}

function doMigration (mangaList: MigrationManga[]) {
  mangaList.forEach(item => {
    if (item.linkedSites === undefined) {
      const linkedSites = {} as Record<string, number>
      if (item.mangaDexId !== undefined) {
        linkedSites[SiteType.MangaDex] = item.mangaDexId
      }

      item.linkedSites = linkedSites
      delete item.mangaDexId
    }

    if (item.status === undefined) {
      item.status = item.completed === true ? Status.COMPLETED : Status.READING
      delete item.completed
    }

    if (item.site === 'secretscans.co') {
      item.site = SiteType.LynxScans
    }
  })

  return mangaList
}
