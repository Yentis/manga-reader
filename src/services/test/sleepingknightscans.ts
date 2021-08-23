import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.SleepingKnightScans
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'volcanic age'

export async function testSleepingKnightScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = '151 - 2nd Season End'
  desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-chronicles-193x278.png'
  desired.title = 'Chronicles of Heavenly Demon'
  desired.chapterUrl = 'https://skscans.com/manga/chronicles-of-heavenly-demon/151/'
  desired.chapterNum = 151

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-_VA-193x278.jpg'
  desired.chapter = '181'
  desired.url = 'https://skscans.com/manga/volcanic-age/'

  return searchValid(results, desired, QUERY)
}
