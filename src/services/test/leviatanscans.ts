import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LeviatanScans
const QUERY = 'volcanic age'

export async function testLeviatanScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlCorrectSeasonOrder()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 94

  desired.chapter = `Chapter ${chapter}`
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2023/04/bannerTCF.jpg'
  desired.title = 'Trash of the Count’s Family'
  desired.chapterUrl = `https://en.leviatanscans.com/manga/trash-of-the-counts-family/chapter-${chapter}/`
  desired.chapterNum = chapter
  desired.chapterDate = '3 days ago'

  mangaEqual(manga, desired)
}

async function readUrlCorrectSeasonOrder (): Promise<void> {
  const url = 'https://en.leviatanscans.com/manga/tale-of-a-scribe-who-retires-to-the-countryside/'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  const chapter = 164

  desired.chapter = `Chapter ${chapter}`
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2023/04/bannerTSRC.jpg'
  desired.title = 'Tale of a Scribe Who Retires to the Countryside'
  desired.chapterUrl = `https://en.leviatanscans.com/manga/tale-of-a-scribe-who-retires-to-the-countryside/chapter-${chapter}/`
  desired.chapterNum = chapter

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2023/04/coverVA-193x278.jpg'
  desired.chapter = 'Chapter 240'
  desired.url = 'https://en.leviatanscans.com/manga/volcanic-age/'

  return searchValid(results, desired, QUERY)
}
