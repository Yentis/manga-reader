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
  await readUrlCorrectSeasonOrder()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 143'
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2022/08/cover-iatsk.png'
  desired.title = 'I Am the Sorcerer King'
  desired.chapterUrl = 'https://en.leviatanscans.com/hb/manga/i-am-the-sorcerer-king/chapter-143/'
  desired.chapterNum = 143
  desired.chapterDate = 'a month ago'

  mangaEqual(manga, desired)
}

async function readUrlCorrectSeasonOrder (): Promise<void> {
  const url = 'https://leviatanscans.com/manga/tale-of-a-scribe-who-retires-to-the-countryside/'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  desired.chapter = 'Chapter 123'
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2022/08/cover-TSWRC.png'
  desired.title = 'Tale of a Scribe Who Retires to the Countryside'
  desired.chapterUrl = 'https://en.leviatanscans.com/hb/manga/tale-of-a-scribe-who-retires-to-the-countryside/chapter-123/'
  desired.chapterNum = 123

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://en.leviatanscans.com/wp-content/uploads/2022/08/cover-BE-193x278.png'
  desired.chapter = 'Chapter 212'
  desired.url = 'https://en.leviatanscans.com/hb/manga/burning-effect/'

  return searchValid(results, desired, QUERY)
}
