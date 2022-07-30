import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LeviatanScans
const QUERY = 'burning effect'

export async function testLeviatanScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlWrongSeasonOrder()
  await readUrlCorrectSeasonOrder()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = '30'
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-_TT.png'
  desired.title = 'The Throne'
  desired.chapterUrl = 'https://leviatanscans.com/hy/manga/the-throne/30/'
  desired.chapterNum = 30
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function readUrlWrongSeasonOrder (): Promise<void> {
  const url = 'https://leviatanscans.com/manga/survivor-story-of-a-sword-king-in-a-fantasy-world/'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  desired.chapter = 'Season 3 | Chapter 140'
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-SK.png'
  desired.title = 'Survival Story of a Sword King in a Fantasy World'
  desired.chapterUrl = 'https://leviatanscans.com/hy/manga/survivor-story-of-a-sword-king-in-a-fantasy-world/season-3/chapter-140/'
  desired.chapterNum = 140

  mangaEqual(manga, desired)
}

async function readUrlCorrectSeasonOrder (): Promise<void> {
  const url = 'https://leviatanscans.com/manga/tale-of-a-scribe-who-retires-to-the-countryside/'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  desired.chapter = 'Chapter 114 - Season 2 - Ch 51'
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-_TSRC.png'
  desired.title = 'Tale of a Scribe Who Retires to the Countryside'
  desired.chapterUrl = 'https://leviatanscans.com/hy/manga/tale-of-a-scribe-who-retires-to-the-countryside/chapter-114/'
  desired.chapterNum = 114

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover_BE-193x278.png'
  desired.chapter = 'Chapter 212'
  desired.url = 'https://leviatanscans.com/hy/manga/burning-effect/'

  return searchValid(results, desired, QUERY)
}
