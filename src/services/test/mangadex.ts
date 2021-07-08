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
  desired.chapter = 'Chapter 95 - World of Stars and Stripes - Outro'
  desired.image = 'https://uploads.mangadex.org/covers/1044287a-73df-48d0-b0b2-5327f32dd651/b625ddac-757c-44a4-a392-b315ccdf4fb2.jpg'
  desired.title = 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)'
  desired.chapterUrl = 'https://mangadex.org/chapter/8a984365-fd9d-4f6e-85f9-0d58e0a592a3'
  desired.chapterNum = 95

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://uploads.mangadex.org/covers/159eb4f1-de8f-4c53-91da-03f49fe84250/9450650b-9599-4bf5-b150-4f0d337b484c.jpg'
  desired.chapter = 'Chapter 2 - That’s what\'s unfair about you!'
  desired.url = 'https://mangadex.org/title/159eb4f1-de8f-4c53-91da-03f49fe84250'

  return searchValid(results, desired, QUERY)
}
