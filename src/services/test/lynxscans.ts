import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LynxScans
const QUERY = 'another happy day for the villainess'

export async function testLynxScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Volume 2 Chapter 5'
  desired.image = 'https://lynxscans.com/storage/comics/8D05F5079B603C1A9CC73689B5EC57670EA64A56782F1850/haF3HtsXzE4ZebquDIeTvGvLZ82sUKOBmKMLWVUf.png'
  desired.title = 'Dawn of the Eastland'
  desired.chapterUrl = 'https://lynxscans.com/web/comics/698439-dawn-of-the-eastland/2/5'
  desired.chapterNum = 70

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://lynxscans.com/storage/comics/4431EFC0673555AAB70C6C5D434A0B2BDB3C92B0AB3CF800/VRidS9sTtJR7cOVMZy7DzeYaEwQLbcQ3BXRKhUEN.png'
  desired.chapter = 'Chapter 26'
  desired.url = 'https://lynxscans.com/web/comics/269405-another-happy-day-for-the-villainess'

  return searchValid(results, desired, QUERY)
}
