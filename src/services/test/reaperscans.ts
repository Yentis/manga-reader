import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ReaperScans
const QUERY = 'fff-class trashero'

export async function testReaperScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 66'
  desired.image =
    'https://reaperscans.com/_next/image?url=https%3A%2F%2Fmedia.reaperscans.com%2Ffile%2F4SRBHm%2Fcomics%2Fe80bc5cb-8a5a-4a8c-9b0e-b7d897251c3c%2FjKsllTU5dccCWwq6R7AbPpwHRRkAFMKY6vuW5Fln.png&w=640&q=75'
  desired.title = 'FFF-Class Trashero'
  desired.chapterUrl = `${site.getUrl()}/series/fff-class-trashero/chapter-66`
  desired.chapterNum = 66
  desired.chapterDate = '2 years ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image =
    'https://media.reaperscans.com/file/4SRBHm/comics/e80bc5cb-8a5a-4a8c-9b0e-b7d897251c3c/jKsllTU5dccCWwq6R7AbPpwHRRkAFMKY6vuW5Fln.png'
  desired.chapter = 'Chapter 66'
  desired.url = `${site.getUrl()}/series/fff-class-trashero`

  return searchValid(results, desired, QUERY)
}
