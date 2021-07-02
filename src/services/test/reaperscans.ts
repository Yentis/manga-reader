import { Manga } from 'src/classes/manga'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ReaperScans
const TEST_URL = GenkanWorker.getTestUrl(SITE_TYPE)
const QUERY = 'aire'

export async function testReaperScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 27'
  desired.image = 'https://media.reaperscans.com/file/reaperscans/comics/951B222AB3EADADCBB32E241E817845AB609514BC21D2BAD/LMlEbRetOe0yzQorJjR87sMB8021OfFznpjdkaAN.jpeg'
  desired.title = 'Aire'
  desired.chapterUrl = 'https://reaperscans.com/comics/353239-aire/1/27'
  desired.chapterNum = 27

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://media.reaperscans.com/file/reaperscans/comics/951B222AB3EADADCBB32E241E817845AB609514BC21D2BAD/LMlEbRetOe0yzQorJjR87sMB8021OfFznpjdkaAN.jpeg'
  desired.chapter = 'Chapter 27'
  desired.url = 'https://reaperscans.com/comics/353239-aire'

  return searchValid(results, desired, QUERY)
}
