import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ZeroScans
const QUERY = 'all heavenly days'

export async function testZeroScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 48'
  desired.image = 'https://api.zscans.com/storage/76097/conversions/07e0721be5f0d441a13507975adaabf9-full.webp'
  desired.title = 'All Heavenly Days'
  desired.chapterUrl = `${site.getUrl()}/comics/all-heavenly-days/384`
  desired.chapterNum = 48
  desired.chapterDate = '2 years ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://api.zscans.com/storage/76097/conversions/07e0721be5f0d441a13507975adaabf9-full.webp'
  desired.chapter = 'Chapter 48'
  desired.url = `${site.getUrl()}/comics/all-heavenly-days`

  return searchValid(results, desired, QUERY)
}
