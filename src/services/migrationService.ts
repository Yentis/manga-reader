import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { SiteType } from 'src/enums/siteEnum'
import { Status } from 'src/enums/statusEnum'
import { version } from '../../package.json'

const migrationVersion: string = LocalStorage.getItem(constants().MIGRATION_VERSION) || ''

interface MigrationManga {
  mangaDexId: number | undefined
  linkedSites: Record<string, number> | undefined
  completed: boolean | undefined
  status: Status | undefined
}

export function tryMigrateMangaList () {
  if (migrationVersion === version) return
  const mangaList: MigrationManga[] | null = LocalStorage.getItem(constants().MANGA_LIST_KEY)

  if (mangaList) {
    LocalStorage.set(constants().MANGA_LIST_KEY, doMigration(mangaList))
  }
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
  })

  return mangaList
}
