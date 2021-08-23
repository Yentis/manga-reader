import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaTx
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'grandest wedding'

export async function testMangaTx (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 169 [End]'
  desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
  desired.title = 'Grandest Wedding'
  desired.chapterUrl = 'https://mangatx.com/manga/grandest-wedding/chapter-169-end/'
  desired.chapterNum = 169

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
  desired.chapter = 'Chapter 169 [End]'
  desired.url = 'https://mangatx.com/manga/grandest-wedding/'

  return searchValid(results, desired, QUERY)
}
