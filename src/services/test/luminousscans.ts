import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LuminousScans
const QUERY = 'jubunnoichi no hanayome'

export async function testLuminousScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 20 : Hoshino\'s Answer'
  desired.image = 'https://luminousscans.com/wp-content/uploads/2021/08/Black-Kanojo.jpg'
  desired.title = 'Black Kanojo'
  desired.chapterUrl = 'https://luminousscans.com/black-kanojo-chapter-20/'
  desired.chapterNum = 20
  desired.chapterDate = moment('November 1, 2021', 'MMMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://luminousscans.com/wp-content/uploads/2021/09/001-16-212x300.jpg'
  desired.chapter = '59.5'
  desired.url = 'https://luminousscans.com/series/jubunnoichi-no-hanayome/'

  return searchValid(results, desired, QUERY)
}
