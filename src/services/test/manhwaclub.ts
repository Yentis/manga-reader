import { Manga } from 'src/classes/manga'
import { ManhwaClubWorker } from 'src/classes/sites/manhwaclub/manhwaclubWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ManhwaClub
const TEST_URL = ManhwaClubWorker.testUrl
const QUERY = 'cram school scandal'

export async function testManhwaClub (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 24 - The End'
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/9.jpg'
  desired.title = 'My Uncle'
  desired.chapterUrl = 'https://manhwa.club/comic/my-uncle/chapter-24-end/reader'
  desired.chapterNum = 24

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/70370.jpg'
  desired.chapter = 'Chapter 30 END'
  desired.url = 'https://manhwa.club/comic/cram-school-scandal'

  return searchValid(results, desired, QUERY)
}
