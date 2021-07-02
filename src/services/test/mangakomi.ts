import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaKomi
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'nanatsu no taizai'

export async function testMangaKomi (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 34 - The End'
  desired.image = 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432.png'
  desired.title = 'Good Night'
  desired.chapterUrl = 'https://mangakomi.com/manga/good-night/chapter-34/'
  desired.chapterNum = 34

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://mangakomi.com/wp-content/uploads/2020/03/thumb_5e5c4904a9158.jpg'
  desired.chapter = 'Chapter 346.6'
  desired.url = 'https://mangakomi.com/manga/nanatsu-no-taizai/'

  return searchValid(results, desired, QUERY)
}
