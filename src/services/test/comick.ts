import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import moment from 'moment'

const SITE_TYPE = SiteType.ComicK
const QUERY = 'trophy husband'

export async function testComicK(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Ch. 55'
  desired.image = 'https://meo.comick.pictures/br1Yoq.jpg'
  desired.title = 'Trophy Husband'
  desired.chapterUrl = `${site.getUrl()}/comic/02-trophy-husband/G8h61xDr`
  desired.chapterNum = 55
  desired.chapterDate = moment('2023-12-30T10:42:53Z').fromNow()

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://meo.comick.pictures/br1Yoq.jpg'
  desired.chapter = 'Ch. 55'
  desired.url = `${site.getUrl()}/comic/02-trophy-husband`

  return searchValid(results, desired, QUERY)
}
