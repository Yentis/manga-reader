import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.SleepingKnightScans
const QUERY = 'volcanic age'

export async function testSleepingKnightScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = '151 - 2nd Season End'
  desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-chronicles-193x278.png'
  desired.title = 'Chronicles of Heavenly Demon'
  desired.chapterUrl = 'https://skscans.com/manga/chronicles-of-heavenly-demon/151/'
  desired.chapterNum = 151

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-_VA-193x278.jpg'
  desired.chapter = '181'
  desired.url = 'https://skscans.com/manga/volcanic-age/'

  return searchValid(results, desired, QUERY)
}
