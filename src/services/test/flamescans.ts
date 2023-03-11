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
  desired.chapter = 'Chapter 89'
  desired.image = 'https://flamescans.org/wp-content/uploads/2021/11/whhvol9cover.png'
  desired.title = 'The Way of the Househusband'
  desired.chapterUrl = 'https://flamescans.org/1678532461-the-way-of-the-househusband-chapter-89/'
  desired.chapterNum = 89
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://flamescans.org/wp-content/uploads/2021/01/berserk-of-gluttony-cover-1-237x350.png'
  desired.chapter = '39'
  desired.url = 'https://flamescans.org/series/1678532521-berserk-of-gluttony/'

  return searchValid(results, desired, QUERY)
}
