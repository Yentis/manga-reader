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
  desired.chapter = 'Ch.023'
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/570.jpg'
  desired.title = 'Real Man (Dogado)'
  desired.chapterUrl = 'https://manhwa.club/comic/real-man-dogado/chapter-23/reader'
  desired.chapterNum = 23

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/1096.jpg'
  desired.chapter = 'Chapter 30 - The End'
  desired.url = 'https://manhwa.club/comic/cram-school-scandal'

  return searchValid(results, desired, QUERY)
}
