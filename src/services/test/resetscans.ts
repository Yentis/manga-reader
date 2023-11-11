import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ResetScans
const QUERY = 'zoo in the dorm'

export async function testResetScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga('https://reset-scans.com/manga/the-unwanted-undead-adventurer/', SITE_TYPE)
  const chapter = 58

  desired.chapter = `Chapter ${chapter}`
  desired.image = 'https://reset-scans.com/wp-content/uploads/2022/11/UNWANTED-UNDEAD-350x476.webp'
  desired.title = 'The Unwanted Undead Adventurer'
  desired.chapterUrl = `https://reset-scans.com/manga/the-unwanted-undead-adventurer/chapter-${chapter}/`
  desired.chapterNum = chapter
  desired.chapterDate = '10 days ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://reset-scans.com/wp-content/uploads/2021/05/Zoo-Dorm-193x278.png'
  desired.chapter = 'Chapter 18'
  desired.url = 'https://reset-scans.com/manga/zoo-in-the-dormitory-01/'

  return searchValid(results, desired, QUERY)
}
