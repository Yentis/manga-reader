import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ResetScans
const QUERY = 'control master'

export async function testResetScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(`${site.getUrl()}/manga/the-unwanted-undead-adventurer/`, SITE_TYPE)
  const chapter = 63

  desired.chapter = `Chapter ${chapter}`
  desired.image = 'https://reset-scans.co/wp-content/uploads/2024/10/The-Unwanted-Undead-Adventurer-350x476.webp'
  desired.title = 'The Unwanted Undead Adventurer'
  desired.chapterUrl = `${site.getUrl()}/manga/the-unwanted-undead-adventurer/chapter-${chapter}/`
  desired.chapterNum = chapter
  desired.chapterDate = '2 months ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://reset-scans.co/wp-content/uploads/2024/12/Control-Player-193x278.webp'
  desired.chapter = 'Chapter 34'
  desired.url = 'https://reset-scans.co/manga/control-master/'

  return searchValid(results, desired, QUERY)
}
