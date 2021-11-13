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
  desired.chapter = 'Chapter 9'
  desired.image = 'https://flamescans.org/wp-content/uploads/2021/02/7-6.jpg'
  desired.title = 'You, the One and Only, and the Seven Billion Grim Reapers'
  desired.chapterUrl = 'https://flamescans.org/you-the-one-and-only-and-the-seven-billion-grim-reapers-chapter-9-epilogue/'
  desired.chapterNum = 9

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
