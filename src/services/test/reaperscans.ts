import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ReaperScans
const QUERY = 'aire'

export async function testReaperScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 45'
  desired.image = 'https://reaperscans.com/wp-content/uploads/2021/07/AnyConv.com__AIRE.webp'
  desired.title = 'Aire'
  desired.chapterUrl = 'https://reaperscans.com/series/aire/chapter-45/'
  desired.chapterNum = 45

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://reaperscans.com/wp-content/uploads/2021/07/AnyConv.com__AIRE-193x278.webp'
  desired.chapter = 'Chapter 45'
  desired.url = 'https://reaperscans.com/series/aire/'

  return searchValid(results, desired, QUERY)
}
