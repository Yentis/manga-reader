import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AsuraScans
const QUERY = 'mookhyang the origin'

export async function testAsuraScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlAdvanced()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 47'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2021/02/ponytail_boy_.png?v=1652281235'
  desired.title = 'Mookhyang The Origin'
  desired.chapterUrl = 'https://www.asurascans.com/mookhyang-the-origin-chapter-47/'
  desired.chapterNum = 47
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function readUrlAdvanced (): Promise<void> {
  const testUrl = 'https://www.asurascans.com/comics/solo-bug-player/'
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)
  desired.chapter = 'Chapter 88'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2021/02/cover4.gif'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://www.asurascans.com/solo-bug-player-chapter-88/'
  desired.chapterNum = 88
  desired.chapterDate = '3 months ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2021/02/ponytail_boy_-222x300.png'
  desired.chapter = '47'
  desired.url = 'https://www.asurascans.com/comics/1649969363-mookhyang-the-origin/'

  return searchValid(results, desired, QUERY)
}
