import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Tapas
const QUERY = 'mystic musketeer'

export async function testTapas (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlReverseOrder()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = '108. Please Send Me a Letter'
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/53/035d7813-b234-45d6-b880-5563a759a95b_z.jpg'
  desired.title = 'Villains Are Destined to Die'
  desired.chapterUrl = 'https://tapas.io/episode/2760652'
  desired.chapterNum = 119
  desired.chapterDate = '4 days ago'

  mangaEqual(manga, desired)
}

async function readUrlReverseOrder (): Promise<void> {
  const manga = await getMangaInfo('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  const desired = new Manga('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  desired.chapter = 'Episode 94'
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/7e/923721d0-86a3-4679-a929-4efe5945c10f_z.jpg'
  desired.title = 'Mystic Musketeer'
  desired.chapterUrl = 'https://tapas.io/episode/2736139'
  desired.chapterNum = 94

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/7e/923721d0-86a3-4679-a929-4efe5945c10f_z.jpg'
  desired.chapter = 'Episode 94'
  desired.url = 'https://tapas.io/series/mystic-musketeer/info'

  return searchValid(results, desired, QUERY)
}
