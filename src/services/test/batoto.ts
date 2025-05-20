import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Batoto
const QUERY = 'I found somebody to love'

export async function testBatoto(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 13

  desired.chapter = `Sequel ${chapter} [END]`
  desired.title = 'Doctor Elise: The Royal Lady with the Lamp'
  desired.image =
    'https://n29.mbcej.org/thumb/W600/ampi/6c5/6c5a266892eee0a9aa82b7acbf5447a8f3c1cbf1_294_427_94286.jpeg'
  desired.chapterUrl = 'https://bato.to/chapter/2889144'
  desired.chapterNum = chapter
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image =
    'https://n24.mbqgu.org/thumb/W300/ampi/cd4/cd43759af3efabf4e16729443a0244b9d76df0fe_420_610_295421.jpg'
  desired.chapter = 'Ch.88'
  desired.url = 'https://bato.to/series/75371/i-found-somebody-to-love'

  return searchValid(results, desired, QUERY)
}
