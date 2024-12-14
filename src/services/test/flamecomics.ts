import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.FlameComics
const QUERY = 'berserk of gluttony'

export async function testFlameComics(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = '89'
  desired.image = 'https://flamecomics.xyz/_next/image?url=https%3A%2F%2Fcdn.flamecomics.xyz%2Fseries%2F61%2Fthumbnail.png&w=1920&q=100'
  desired.title = 'The Way of the Househusband'
  desired.chapterUrl = 'https://flamecomics.xyz/series/61/a0c0ef30c1ef3344'
  desired.chapterNum = 89
  desired.chapterDate = '23 days ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://flamecomics.xyz/_next/image?url=https%3A%2F%2Fcdn.flamecomics.xyz%2Fseries%2F3%2Fthumbnail.png&w=1920&q=100'
  desired.chapter = '39'
  desired.url = 'https://flamecomics.xyz/series/3'

  return searchValid(results, desired, QUERY)
}
