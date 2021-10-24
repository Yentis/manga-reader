import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AsuraScans
const QUERY = 'tougen anki'

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
  desired.chapter = 'Chapter 19'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2020/09/49754.jpg'
  desired.title = 'Tougen Anki'
  desired.chapterUrl = 'https://www.asurascans.com/tougen-anki-chapter-19/'
  desired.chapterNum = 19

  mangaEqual(manga, desired)
}

async function readUrlAdvanced (): Promise<void> {
  const testUrl = 'https://www.asurascans.com/comics/solo-bug-player/'
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)
  desired.chapter = 'Chapter 80'
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2021/02/cover4.gif'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://www.asurascans.com/solo-bug-player-chapter-80/'
  desired.chapterNum = 80

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://www.asurascans.com/wp-content/uploads/2020/09/49754-194x300.jpg'
  desired.chapter = '19'
  desired.url = 'https://www.asurascans.com/comics/tougen-anki/'

  return searchValid(results, desired, QUERY)
}
