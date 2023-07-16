import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.HiperDEX
const QUERY = 'cabalist'

export async function testHiperDEX (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrl2()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 84 - [END]'
  desired.image = 'https://hiperdex.com/wp-content/uploads/2022/01/10-Years-in-the-Friend-Zone.webp'
  desired.title = '10 Years in the Friend Zone'
  desired.chapterUrl = 'https://hiperdex.com/manga/10-years-in-the-friend-zone/chapter-84/'
  desired.chapterNum = 84
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function readUrl2 (): Promise<void> {
  const manga = await getMangaInfo('https://hiperdex.com/manga/touch-on/', SITE_TYPE)
  const desired = new Manga('https://hiperdex.com/manga/touch-on/', SITE_TYPE)
  desired.chapter = '109.3'
  desired.image = 'https://hiperdex.com/wp-content/uploads/2020/06/Touch-On-193x278.jpg'
  desired.title = 'Touch On'
  desired.chapterUrl = 'https://hiperdex.com/manga/touchon191222/109-3/'
  desired.chapterNum = 109.3
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Cabalist-193x278.jpg'
  desired.chapter = '44 [END]'
  desired.url = 'https://hiperdex.com/manga/cabalist/'

  return searchValid(results, desired, QUERY)
}
