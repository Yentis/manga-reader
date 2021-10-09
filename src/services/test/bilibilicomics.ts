import { Manga } from 'src/classes/manga'
import { BiliBiliComicsWorker } from 'src/classes/sites/bilibilicomics/bilibilicomicsWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.BiliBiliComics
const TEST_URL = BiliBiliComicsWorker.testUrl
const QUERY = 'beloved'

export async function testBiliBiliComics (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = '598 Discussion(2)'
  desired.image = 'http://i0.hdslb.com/bfs/comic-static/58c0cc6a498b2d8c74e5ca1f283393cd26501e71.png@300w.webp'
  desired.title = 'Tales of Demons and Gods'
  desired.chapterUrl = '/mangaviewer?type=bilibilicomics.com&data=%7B%22id%22%3A215%2C%22chapter%22%3A21115%7D'
  desired.chapterNum = 598

  mangaEqual(manga, desired, false)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga('https://www.bilibilicomics.com/detail/mc245', SITE_TYPE)
  desired.image = 'http://i0.hdslb.com/bfs/comic-static/798919b4975940465d33396b4a8a874517caafdd.png@300w.webp'
  desired.chapter = '25 Liu Yuan! Just Wait and See!'

  return searchValid(results, desired, 'My Beloved Liu Yu\'an')
}
