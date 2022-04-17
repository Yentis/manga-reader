import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.FlameScans
const QUERY = 'berserk of gluttony'

export async function testFlameScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 179.5 [END]'
  desired.image = 'https://flamescans.org/wp-content/uploads/2021/01/solo-cover-1.png'
  desired.title = 'Solo Leveling'
  desired.chapterUrl = 'https://flamescans.org/1650124861-solo-leveling-chapter-179-5/'
  desired.chapterNum = 179.5
  desired.chapterDate = moment('January 3, 2022', 'MMMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://flamescans.org/wp-content/uploads/2021/01/berserk-of-gluttony-cover-1-237x350.png'
  desired.chapter = '39'
  desired.url = 'https://flamescans.org/series/berserk-of-gluttony/'

  return searchValid(results, desired, QUERY)
}
