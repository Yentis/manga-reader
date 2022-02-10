import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaTx
const QUERY = 'grandest wedding'

export async function testMangaTx (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 169 [End]'
  desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
  desired.title = 'Grandest Wedding'
  desired.chapterUrl = 'https://mangatx.com/manga/grandest-wedding/chapter-169-end/'
  desired.chapterNum = 169
  desired.chapterDate = moment('October 19, 2019', 'MMMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
  desired.chapter = 'Chapter 169 [End]'
  desired.url = 'https://mangatx.com/manga/grandest-wedding/'

  return searchValid(results, desired, QUERY)
}
