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
  desired.chapter = 'Chapter 57 - Season 1 End'
  desired.image = 'https://media.reaperscans.com/file/4SRBHm/comics/de85c420-0e91-4d54-8aa3-717e7d9a039e/7HYm7hursFouoHYjAJZGPiIzU5SC6wN6y1rixxiq.png'
  desired.title = 'Aire'
  desired.chapterUrl = 'https://reaperscans.com/comics/7946-aire/chapters/28705678-chapter-57'
  desired.chapterNum = 57
  desired.chapterDate = '3 days ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://media.reaperscans.com/file/4SRBHm/comics/de85c420-0e91-4d54-8aa3-717e7d9a039e/7HYm7hursFouoHYjAJZGPiIzU5SC6wN6y1rixxiq.png'
  desired.chapter = '57 Chapters'
  desired.url = 'https://reaperscans.com/comics/7946-aire'

  return searchValid(results, desired, QUERY)
}
