import { Manga } from 'src/classes/manga'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.HatigarmScans
const TEST_URL = GenkanWorker.getTestUrl(SITE_TYPE)
const QUERY = 'x epoch of dragon'

export async function testHatigarmScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 5'
  desired.image = 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg'
  desired.title = 'Ichizu de Bitch na Kouhai'
  desired.chapterUrl = 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5'
  desired.chapterNum = 5

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://hatigarmscanz.net/storage/comics/E8D061825E549CFD9F2C762C6E15A4B393428101A8925D08/XIP9e5jwQQQo3IGjeDj0lbiIRE2t6HNRvRyikUTL.jpeg'
  desired.chapter = 'The 1% Effort Punch'
  desired.url = 'https://hatigarmscanz.net/comics/469569-x-epoch-of-dragon'

  return searchValid(results, desired, QUERY)
}
