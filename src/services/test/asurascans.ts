import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AsuraScans
const QUERY = 'mookhyang the origin'

export async function testAsuraScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlAdvanced(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 47'
  desired.image = 'https://gg.asuracomic.net/storage/media/114/conversions/367e3d17-optimized.webp'
  desired.title = 'Mookhyang The Origin'
  desired.chapterUrl = 'https://asuracomic.net/series/mookhyang-the-origin-db322c79/chapter/47'
  desired.chapterNum = 47
  desired.chapterDate = '3 years ago'

  mangaEqual(manga, desired)
}

async function readUrlAdvanced(site: BaseSite): Promise<void> {
  const testUrl = `${site.getUrl()}/series/solo-bug-player-e800d15b`
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)
  desired.chapter = 'Chapter 88'
  desired.image = 'https://gg.asuracomic.net/storage/media/245/01J3BAR5EFJJSB84FC5GDZYSW7.webp'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://asuracomic.net/series/solo-bug-player-801f11eb/chapter/88'
  desired.chapterNum = 88

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://gg.asuracomic.net/storage/media/114/conversions/367e3d17-thumb-small.webp'
  desired.chapter = 'Chapter 47'
  desired.url = 'https://asuracomic.net/series/mookhyang-the-origin-db322c79'

  return searchValid(results, desired, QUERY)
}
