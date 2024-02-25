import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ResetScans
const QUERY = 'karate baka isekai'

export async function testResetScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(`${site.getUrl()}/manga/the-unwanted-undead-adventurer/`, SITE_TYPE)
  const chapter = 60

  desired.chapter = `Chapter ${chapter}`
  desired.image = `${site.getUrl()}/wp-content/uploads/2021/06/UNWANTED-UNDEAD-350x476.webp`
  desired.title = 'The Unwanted Undead Adventurer'
  desired.chapterUrl = `${site.getUrl()}/manga/the-unwanted-undead-adventurer/chapter-${chapter}/`
  desired.chapterNum = chapter
  desired.chapterDate = '21 days ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = `${site.getUrl()}/wp-content/uploads/2022/11/Karate-Baka-Isekai-193x278.webp`
  desired.chapter = 'Chapter 25'
  desired.url = `${site.getUrl()}/manga/karate-baka-isekai/`

  return searchValid(results, desired, QUERY)
}
