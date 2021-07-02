import { Manga } from 'src/classes/manga'
import { MangakakalotWorker } from 'src/classes/sites/mangakakalot/mangakakalotWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Mangakakalot
const TEST_URL = MangakakalotWorker.testUrl
const QUERY = 'together with the rain'

export async function testMangakakalot (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Vol.8 Chapter 953.6: Volume 8 Extras'
  desired.image = 'https://avt.mkklcdnv6temp.com/19/e/1-1583464448.jpg'
  desired.title = 'Tomo-chan wa Onnanoko!'
  desired.chapterUrl = 'https://mangakakalot.com/chapter/tomochan_wa_onnanoko/chapter_953.6'
  desired.chapterNum = 953.6

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://avt.mkklcdnv6temp.com/48/l/21-1597329685.jpg'
  desired.chapter = 'Chapter 2: That’s What\'s Unfair About You! [END]'
  desired.url = 'https://mangakakalot.com/manga/pg923760'

  await searchValid(results, desired, QUERY)

  const query2 = 'this song only for you'
  const results2 = await searchManga(query2, SITE_TYPE)
  const desired2 = new Manga('https://readmanganato.com/manga-hv985178', SITE_TYPE)
  desired2.image = 'https://avt.mkklcdnv6temp.com/4/p/21-1587119305.jpg'
  desired2.chapter = 'Chapter 21'
  desired2.url = 'https://readmanganato.com/manga-hv985178'

  return searchValid(results2, desired2, query2)
}
