import { Manga } from 'src/classes/manga'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaDex
const TEST_URL = MangaDexWorker.testUrl
const QUERY = 'together with the rain'

export async function testMangaDex (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Vol. 24 Ch. 95 - World of Stars and Stripes - Outro'
  desired.image = 'https://mangadex.org/images/manga/6272.jpg?1612558729'
  desired.title = 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)'
  desired.chapterUrl = 'https://mangadex.org/chapter/24552'
  desired.chapterNum = 95

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://mangadex.org/images/manga/52590.jpg?1596841158'
  desired.chapter = 'Ch. 2 - That’s what\'s unfair about you!'
  desired.url = 'https://mangadex.org/title/52590/together-with-the-rain'

  return searchValid(results, desired, QUERY)
}
