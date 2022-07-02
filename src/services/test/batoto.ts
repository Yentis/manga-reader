import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import * as SiteUtils from 'src/utils/siteUtils'

const SITE_TYPE = SiteType.Batoto
const QUERY = 'I found somebody to love'

export async function testBatoto (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 143 [END]'
  desired.title = 'Doctor Elise: The Royal Lady with the Lamp'
  desired.image = 'https://xfs-210.batcg.com/thumb/W600/ampi/bab/babb58b5b128acf2a01d5710f77d67e1af8a6fe7_420_610_328588.jpeg'
  desired.chapterUrl = 'https://bato.to/chapter/1629009'
  desired.chapterNum = 143
  desired.chapterDate = SiteUtils.getDateFromNow('326 days ago')

  imageContains(manga, desired)
  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://xfs-201.batcg.com/thumb/W300/ampi/cd4/cd43759af3efabf4e16729443a0244b9d76df0fe_420_610_295421.jpg'
  desired.chapter = 'Ch.88'
  desired.url = 'https://bato.to/series/75371/i-found-somebody-to-love'

  const resultManga = results[0]
  if (!resultManga) throw Error(`Failed ${desired.url}\nNo matching results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(results)}`)

  imageContains(resultManga, desired)
  return searchValid(results, desired, QUERY)
}

function imageContains (actual: Manga | Error, desired: Manga) {
  if (actual instanceof Error) throw actual

  if (!actual.image.includes(desired.image)) {
    throw Error(`Image did not contain: ${desired.image}, was: ${actual.image}`)
  }

  desired.image = actual.image
}
