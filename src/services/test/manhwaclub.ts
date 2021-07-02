import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ManhwaClub
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'settia'

export async function testManhwaClub (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 25'
  desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
  desired.title = 'Settia'
  desired.chapterUrl = 'https://manhwa.club/manhwa/settia/chapter-25'
  desired.chapterNum = 25

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
  desired.chapter = 'Chapter 25'
  desired.url = 'https://manhwa.club/manhwa/settia/'

  return searchValid(results, desired, QUERY)
}
