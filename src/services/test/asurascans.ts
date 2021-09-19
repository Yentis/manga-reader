import { Manga } from 'src/classes/manga'
import { AsuraScansWorker } from 'src/classes/sites/asura/asurascansWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AsuraScans
const TEST_URL = AsuraScansWorker.getTestUrl(SITE_TYPE)
const QUERY = 'tougen anki'

export async function testAsuraScans (): Promise<void> {
  await readUrl()
  await readUrlAdvanced()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 19'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2020/09/49754.jpg'
  desired.title = 'Tougen Anki'
  desired.chapterUrl = 'https://www.asurascans.com/tougen-anki-chapter-19/'
  desired.chapterNum = 19

  mangaEqual(manga, desired)
}

async function readUrlAdvanced (): Promise<void> {
  const testUrl = 'https://www.asurascans.com/comics/solo-bug-player/'
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)
  desired.chapter = 'Chapter 78'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2021/02/ezgif.com-gif-maker-1.gif'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://www.asurascans.com/solo-bug-player-chapter-78/'
  desired.chapterNum = 78

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2020/09/49754-194x300.jpg'
  desired.chapter = '19'
  desired.url = 'https://www.asurascans.com/comics/tougen-anki/'

  return searchValid(results, desired, QUERY)
}
