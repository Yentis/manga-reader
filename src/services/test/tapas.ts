import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Tapas
const QUERY = 'mystic musketeer'

export async function testTapas(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlReverseOrder()
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 160

  desired.chapter = `${chapter}. Wild Speculations`
  desired.image = 'https://us-a.tapas.io/sa/bb/a9590c3b-757c-468c-bd33-53bf3d1681b5_z.jpg'
  desired.title = 'Villains Are Destined to Die'
  desired.chapterUrl = 'https://tapas.io/episode/3366100'
  desired.chapterNum = chapter + 12
  desired.chapterDate = '3 days ago'

  mangaEqual(manga, desired)
}

async function readUrlReverseOrder(): Promise<void> {
  const manga = await getMangaInfo('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  const desired = new Manga('https://tapas.io/series/mystic-musketeer/info', SITE_TYPE)
  const chapter = 139

  desired.chapter = `Episode ${chapter}`
  desired.image = 'https://us-a.tapas.io/sa/32/f137786b-242f-4257-aeac-070175da5dd6_z.jpg'
  desired.title = 'Mystic Musketeer'
  desired.chapterUrl = 'https://tapas.io/episode/3373680'
  desired.chapterNum = chapter

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://us-a.tapas.io/sa/32/f137786b-242f-4257-aeac-070175da5dd6_z.jpg'
  desired.chapter = 'Episode 139'
  desired.url = 'https://tapas.io/series/mystic-musketeer/info'

  return searchValid(results, desired, QUERY)
}
