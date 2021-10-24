import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.HatigarmScans
const QUERY = 'x epoch of dragon'

export async function testHatigarmScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 5'
  desired.image = 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg'
  desired.title = 'Ichizu de Bitch na Kouhai'
  desired.chapterUrl = 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5'
  desired.chapterNum = 5

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://hatigarmscanz.net/storage/comics/E8D061825E549CFD9F2C762C6E15A4B393428101A8925D08/XIP9e5jwQQQo3IGjeDj0lbiIRE2t6HNRvRyikUTL.jpeg'
  desired.chapter = 'The 1% Effort Punch'
  desired.url = 'https://hatigarmscanz.net/comics/469569-x-epoch-of-dragon'

  return searchValid(results, desired, QUERY)
}
