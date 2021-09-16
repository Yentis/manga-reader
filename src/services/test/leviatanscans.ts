import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LeviatanScans
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'burning effect'

export async function testLeviatanScans (): Promise<void> {
  await readUrl()
  await readUrlWrongSeasonOrder()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = '30'
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-_TT-193x278.png'
  desired.title = 'The Throne'
  desired.chapterUrl = 'https://leviatanscans.com/alli/manga/the-throne/30/'
  desired.chapterNum = 30

  mangaEqual(manga, desired)
}

async function readUrlWrongSeasonOrder (): Promise<void> {
  const url = 'https://leviatanscans.com/manga/survivor-story-of-a-sword-king-in-a-fantasy-world/'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  desired.chapter = 'Season 2 | 105'
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-SK-193x278.png'
  desired.title = 'Survival Story of a Sword King in a Fantasy World'
  desired.chapterUrl = 'https://leviatanscans.com/alli/manga/survivor-story-of-a-sword-king-in-a-fantasy-world/season-2/105/'
  desired.chapterNum = 105

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover_BE-193x278.png'
  desired.chapter = '188'
  desired.url = 'https://leviatanscans.com/alli/manga/burning-effect/'

  return searchValid(results, desired, QUERY)
}
