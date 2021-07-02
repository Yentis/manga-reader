import { Manga } from 'src/classes/manga'
import { ManganeloWorker } from 'src/classes/sites/manganelo/manganeloWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Manganelo
const TEST_URL = ManganeloWorker.testUrl
const QUERY = 'together with the rain'

export async function testManganelo (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Vol.6 Chapter 57: The Final Chapter'
  desired.image = 'https://avt.mkklcdnv6temp.com/8/x/18-1583497426.jpg'
  desired.title = 'Kudan No Gotoshi'
  desired.chapterUrl = 'https://readmanganato.com/manga-dt981276/chapter-57'
  desired.chapterNum = 57

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://avt.mkklcdnv6temp.com/48/l/21-1597329685.jpg'
  desired.chapter = 'Chapter 2: That’s what\'s unfair about you! [END]'
  desired.url = 'https://manganelo.com/manga/pg923760'

  return searchValid(results, desired, QUERY)
}
