import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

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
  desired.image = 'https://xfs-204.batcg.org/thumb/W600/ampi/bab/babb58b5b128acf2a01d5710f77d67e1af8a6fe7_420_610_328588.jpeg'
  desired.chapterUrl = 'https://bato.to/chapter/1629009'
  desired.chapterNum = 143
  desired.chapterDate = '2 years ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://xfs-216.batcg.org/thumb/W300/ampi/cd4/cd43759af3efabf4e16729443a0244b9d76df0fe_420_610_295421.jpg'
  desired.chapter = 'Ch.88'
  desired.url = 'https://bato.to/series/75371/i-found-somebody-to-love'

  return searchValid(results, desired, QUERY)
}
