import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.HiperDEX
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'cabalist'

export async function testHiperDEX (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = '35 [END]'
  desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Arata-Primal-193x278.jpg'
  desired.title = 'Arata Primal'
  desired.chapterUrl = 'https://hiperdex.com/manga/arata-primal-the-new-primitive/35-end/'
  desired.chapterNum = 35

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Cabalist-193x278.jpg'
  desired.chapter = '44 [END]'
  desired.url = 'https://hiperdex.com/manga/cabalistin/'

  return searchValid(results, desired, QUERY)
}
