import moment from 'moment'
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
  desired.chapter = '80. Turn Me into a Villain'
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/ba/bd321b26-680a-4911-b675-94a41efce1bf_z.jpg'
  desired.title = 'Villains Are Destined to Die'
  desired.chapterUrl = 'https://tapas.io/episode/2410089'
  desired.chapterNum = 91
  desired.chapterDate = moment('Feb 16, 2022', 'MMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function readUrlReverseOrder (): Promise<void> {
  const manga = await getMangaInfo('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  const desired = new Manga('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  desired.chapter = 'Episode 46'
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/81/e9eb4a65-59fd-46c2-a26e-076d4fed209c_z.jpg'
  desired.title = 'Mystic Musketeer'
  desired.chapterUrl = 'https://tapas.io/episode/2444810'
  desired.chapterNum = 46

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://d30womf5coomej.cloudfront.net/sa/81/e9eb4a65-59fd-46c2-a26e-076d4fed209c_z.jpg'
  desired.chapter = 'Episode 46'
  desired.url = 'https://tapas.io/series/mystic-musketeer/info'

  return searchValid(results, desired, QUERY)
}
