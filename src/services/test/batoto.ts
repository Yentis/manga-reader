import { Manga } from 'src/classes/manga'
import { BatotoWorker } from 'src/classes/sites/batoto/batotoWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Batoto
const TEST_URL = BatotoWorker.testUrl
const QUERY = 'I found somebody to love'

export async function testBatoto (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 143 [END]'
  desired.image = 'https://xfs-000.animemark.net/pictures/W600/bab/babb58b5b128acf2a01d5710f77d67e1af8a6fe7_420_610_328588.jpeg'
  desired.title = 'Doctor Elise: The Royal Lady with the Lamp'
  desired.chapterUrl = 'https://bato.to/chapter/1629009'
  desired.chapterNum = 143

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://xfs-000.animemark.net/pictures/W300/cd4/cd43759af3efabf4e16729443a0244b9d76df0fe_420_610_295421.jpg'
  desired.chapter = 'Ch.88'
  desired.url = 'https://bato.to/series/75371/i-found-somebody-to-love'

  return searchValid(results, desired, QUERY)
}
