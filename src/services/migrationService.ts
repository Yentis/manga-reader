import { LocalStorage } from 'quasar'
import constants from 'src/classes/constants'
import { RefreshOptions } from 'src/classes/refreshOptions'
import { Settings } from 'src/classes/settings'
import { MangaDex } from 'src/classes/sites/mangadex'
import { SiteType } from 'src/enums/siteEnum'
import { Status } from 'src/enums/statusEnum'
import { version } from '../../package.json'
import { requestHandler } from './requestService'

const OPEN_BROWSER_KEY = 'open_browser'
const REFRESH_OPTIONS_KEY = 'refresh_options'
const DROPBOX_TOKEN = 'dropbox_token'

interface MigrationManga {
  mangaDexId: number | undefined
  linkedSites: Record<string, number> | undefined
  completed: boolean | undefined
  status: Status | undefined
  site: string
  url: string
}

export function getMigrationVersion () {
  const migrationVersion = LocalStorage.getItem(constants.MIGRATION_VERSION)
  if (typeof migrationVersion !== 'string') return ''
  return migrationVersion
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
  const refreshOptions: RefreshOptions | null = LocalStorage.getItem(REFRESH_OPTIONS_KEY)

  if (openInBrowser !== null) {
    settings.openInBrowser = openInBrowser
    LocalStorage.remove(OPEN_BROWSER_KEY)
  }

  if (refreshOptions !== null) {
    settings.refreshOptions = refreshOptions
    LocalStorage.remove(REFRESH_OPTIONS_KEY)
  }

  LocalStorage.set(constants.SETTINGS, settings)
}

export function tryMigrateDropbox () {
  if (getMigrationVersion() === version) return
  const dropboxAuth = LocalStorage.getItem(constants.DROPBOX_AUTH)
  if (dropboxAuth) return

  const dropboxToken = LocalStorage.getItem(DROPBOX_TOKEN)
  if (typeof dropboxToken !== 'string') return

  LocalStorage.set(constants.DROPBOX_AUTH, { access_token: dropboxToken })
  LocalStorage.remove(DROPBOX_TOKEN)
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

    if (item.site === SiteType.MangaDex) {
      const split = item.url.replace(`${MangaDex.getUrl()}/title/`, '').split('/')
      const id = split[0]

      if (id !== undefined && id.length < 10) {
        legacyMangaDexManga.push({ index, id: parseInt(id) })
      }
    }
  })

  if (legacyMangaDexManga.length === 0) return mangaList

  try {
    const newMangaDexIdMap = await MangaDex.convertLegacyIds(legacyMangaDexManga.map((item) => item.id), requestHandler)
    legacyMangaDexManga.forEach((item) => {
      const newId = newMangaDexIdMap[item.id]
      if (newId === undefined) return

      const manga = mangaList[item.index]
      if (!manga) return

      manga.url = `${MangaDex.getUrl()}/title/${newId}`
    })
  } catch (error) {
    console.error(error)
  }

  return mangaList
}
