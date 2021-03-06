import { LocalStorage } from 'quasar'
import constants from 'src/classes/constants'
import { RefreshOptions } from 'src/classes/refreshOptions'
import { Settings } from 'src/classes/settings'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'
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
  url: string
}

export function getMigrationVersion () {
  return LocalStorage.getItem(constants.MIGRATION_VERSION) || ''
}

export async function tryMigrateMangaList () {
  if (getMigrationVersion() === version) return
  const mangaList: MigrationManga[] | null = LocalStorage.getItem(constants.MANGA_LIST_KEY)

  if (mangaList !== null) {
    const migratedMangaList = await doMigration(mangaList)
    LocalStorage.set(constants.MANGA_LIST_KEY, migratedMangaList)
  }
}

export function tryMigrateSettings () {
  if (getMigrationVersion() === version) return
  const settings: Settings = LocalStorage.getItem(constants.SETTINGS) || new Settings()
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

  LocalStorage.set(constants.SETTINGS, settings)
}

export async function migrateInput (input: string): Promise<string> {
  const mangaList = JSON.parse(input) as MigrationManga[]
  const migratedMangaList = await doMigration(mangaList)
  return JSON.stringify(migratedMangaList)
}

async function doMigration (mangaList: MigrationManga[]) {
  const legacyMangaDexManga: { index: number, id: number }[] = []

  mangaList.forEach((item, index) => {
    if (item.linkedSites === undefined) {
      const linkedSites: Record<string, number> = {}
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

    if (item.site === SiteType.MangaDex) {
      const split = item.url.replace(`${MangaDexWorker.url}/title/`, '').split('/')
      if (split.length !== 0 && split[0].length < 10) {
        const id = split[0]
        legacyMangaDexManga.push({ index, id: parseInt(id) })
      }
    }
  })

  if (legacyMangaDexManga.length === 0) return mangaList

  try {
    const newMangaDexIdMap = await MangaDexWorker.convertLegacyIds(legacyMangaDexManga.map((item) => item.id))
    legacyMangaDexManga.forEach((item) => {
      const newId = newMangaDexIdMap[item.id]
      if (!newId) return

      mangaList[item.index].url = `${MangaDexWorker.url}/title/${newId}`
    })
  } catch (error) {
    console.error(error)
  }

  return mangaList
}
