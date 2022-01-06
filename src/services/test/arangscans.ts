import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ArangScans
const QUERY = 'leveling up, by only eating!'

export async function testArangScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 32'
  desired.image = 'https://arangscans.org/content/08d93994-4f13-422a-8693-4e1b1f154a77/cover.png?v=zhFg_XfhMBtYtpTrqqH8-QlERdfg04_ZiJ7TkGYHU-M'
  desired.title = 'Leveling Up, by Only Eating!'
  desired.chapterUrl = 'https://arangscans.org/chapters/08d9399b-000f-4e68-8849-a20fdb0c183a/read'
  desired.chapterNum = 32

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://arangscans.org/content/08d93994-4f13-422a-8693-4e1b1f154a77/cover.png?v=zhFg_XfhMBtYtpTrqqH8-QlERdfg04_ZiJ7TkGYHU-M'
  desired.chapter = 'Chapter 32'
  desired.url = 'https://arangscans.org/titles/08d93994-4f13-422a-8693-4e1b1f154a77'

  return searchValid(results, desired, QUERY)
}
