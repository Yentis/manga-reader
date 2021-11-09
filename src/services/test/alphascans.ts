import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AlphaScans
const QUERY = 'how to disguise as a failure'

export async function testAlphaScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 3'
  desired.image = 'https://content.alpha-scans.org//2021/06/1624684704-9305-i349634.png'
  desired.title = 'Lab Mice Game'
  desired.chapterUrl = 'https://alpha-scans.org/lab-mice-game-chapter-3/'
  desired.chapterNum = 3

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://content.alpha-scans.org//2021/06/1623391710-9847-i336634.png'
  desired.chapter = '4'
  desired.url = 'https://alpha-scans.org/manga/how-to-disguise-as-a-failure/'

  return searchValid(results, desired, QUERY)
}
