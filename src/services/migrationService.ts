import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { SiteType } from 'src/enums/siteEnum'
import { version } from '../../package.json'

const migrationVersion: string = LocalStorage.getItem(constants().MIGRATION_VERSION) || ''

interface MigrationManga {
  mangaDexId: number | undefined
  linkedSites: Record<string, number> | undefined
}

export function tryMigrateMangaList () {
  if (migrationVersion === version) return
  const mangaList: MigrationManga[] | null = LocalStorage.getItem(constants().MANGA_LIST_KEY)

  if (mangaList) {
    LocalStorage.set(constants().MANGA_LIST_KEY, doMigration(mangaList))
  }

  LocalStorage.set(constants().MIGRATION_VERSION, version)
}

export function migrateInput (input: string): string {
  const mangaList = JSON.parse(input) as MigrationManga[]
  return JSON.stringify(doMigration(mangaList))
}

function doMigration (mangaList: MigrationManga[]) {
  mangaList.forEach(item => {
    if (item.mangaDexId) {
      const linkedSites = item.linkedSites || {}
      linkedSites[SiteType.MangaDex] = item.mangaDexId

      item.linkedSites = linkedSites
      delete item.mangaDexId
    }
  })

  return mangaList
}
