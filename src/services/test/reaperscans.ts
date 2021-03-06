import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ReaperScans
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'aire'

export async function testReaperScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 27'
  desired.image = 'https://reaperscans.com/wp-content/uploads/2021/07/AIRE.jpeg'
  desired.title = 'Aire'
  desired.chapterUrl = 'https://reaperscans.com/series/aire/chapter-27/'
  desired.chapterNum = 27

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://reaperscans.com/wp-content/uploads/2021/07/AIRE-193x278.jpeg'
  desired.chapter = 'Chapter 27'
  desired.url = 'https://reaperscans.com/series/aire/'

  return searchValid(results, desired, QUERY)
}
