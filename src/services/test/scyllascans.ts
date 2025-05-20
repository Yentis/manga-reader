import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import moment from 'moment'

const SITE_TYPE = SiteType.ScyllaScans
const QUERY = 'one in a hundred'

export async function testScyllaScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 6'
  desired.image = `${site.getUrl()}/storage/covers/65ef1e596107d.jpg`
  desired.title = 'One in a Hundred'
  desired.chapterUrl = `${site.getUrl()}/manga/one-in-a-hundred/6`
  desired.chapterNum = 6
  desired.chapterDate = moment('2024-05-20', 'YYYY-MM-DD').fromNow()

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = `${site.getUrl()}/storage/covers/65ef1e596107d.jpg`
  desired.chapter = 'Chapter 6'

  return searchValid(results, desired, QUERY)
}
