import { Manga } from 'src/classes/manga'
import { ArangScansWorker } from 'src/classes/sites/arang/arangscansWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ArangScans
const TEST_URL = ArangScansWorker.testUrl
const QUERY = 'leveling up, by only eating!'

export async function testArangScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 32'
  desired.image = 'https://arangscans.com/content/08d93994-4f13-422a-8693-4e1b1f154a77/cover.png?v=zhFg_XfhMBtYtpTrqqH8-QlERdfg04_ZiJ7TkGYHU-M'
  desired.title = 'Leveling Up, by Only Eating!'
  desired.chapterUrl = 'https://arangscans.com/chapters/08d9399b-000f-4e68-8849-a20fdb0c183a/read'
  desired.chapterNum = 32

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://arangscans.com/content/08d93994-4f13-422a-8693-4e1b1f154a77/cover.png?v=zhFg_XfhMBtYtpTrqqH8-QlERdfg04_ZiJ7TkGYHU-M'
  desired.chapter = 'Chapter 32'
  desired.url = 'https://arangscans.com/titles/08d93994-4f13-422a-8693-4e1b1f154a77'

  return searchValid(results, desired, QUERY)
}
