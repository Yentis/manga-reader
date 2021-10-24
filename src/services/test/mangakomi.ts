import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaKomi
const QUERY = 'nanatsu no taizai'

export async function testMangaKomi (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 34 - The End'
  desired.image = 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432.png'
  desired.title = 'Good Night'
  desired.chapterUrl = 'https://mangakomi.com/manga/good-night/chapter-34/'
  desired.chapterNum = 34

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://mangakomi.com/wp-content/uploads/2020/03/thumb_5e5c4904a9158.jpg'
  desired.chapter = 'Chapter 346.6'
  desired.url = 'https://mangakomi.com/manga/nanatsu-no-taizai/'

  return searchValid(results, desired, QUERY)
}
