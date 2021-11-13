import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Cubari
const QUERY = 'bleach'

export async function testCubari (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlGuya()
  await search(site)
  await searchGuya(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 152: Check'
  desired.image = 'https://cdn.discordapp.com/attachments/754390245860048900/814308196620697640/23_-_p000_-_aKraa.jpg'
  desired.title = 'One Punch Man'
  desired.chapterUrl = 'https://cubari.moe/read/gist/OPM/152/1/'
  desired.chapterNum = 152

  mangaEqual(manga, desired)
}

async function readUrlGuya (): Promise<void> {
  const manga = await getMangaInfo('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  const desired = new Manga('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  desired.chapter = 'Yu Ishigami Looks Down'
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/23/93348.jpg'
  desired.title = 'Kaguya-sama: Love is War'
  desired.chapterUrl = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/244/1/'
  desired.chapterNum = 244

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://dosbg3xlm0x1t.cloudfront.net/images/items/9784088738833/1200/9784088738833.jpg'
  desired.chapter = 'WHERE ARE ALL THE CHAPTERS?'
  desired.url = 'https://cubari.moe/read/gist/BleachColored/'

  return searchValid(results, desired, 'Bleach - Digital Colored Comics')
}

async function searchGuya (site: BaseSite): Promise<void> {
  const results = await searchManga('kaguya-sama love is war', SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/23/93348.jpg'
  desired.chapter = 'Yu Ishigami Looks Down'
  desired.url = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/'

  return searchValid(results, desired, 'kaguya-sama: love is war')
}
