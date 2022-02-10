import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AlphaScans
const QUERY = 'medical return'

export async function testAlphaScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 148 (END)'
  desired.image = 'https://i2.wp.com/alpha-scans.org/wp-content/uploads/2021/07/Medical-Return-Cover.gif'
  desired.title = 'Medical Return'
  desired.chapterUrl = 'https://alpha-scans.org/medical-return-chapter-148-end/'
  desired.chapterNum = 148
  desired.chapterDate = moment('28/01/2022', 'DD/MM/YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://i2.wp.com/alpha-scans.org/wp-content/uploads/2021/07/Medical-Return-Cover.gif?h=80'
  desired.chapter = '148 (END)'
  desired.url = 'https://alpha-scans.org/manga/medical-return/'

  return searchValid(results, desired, QUERY)
}
