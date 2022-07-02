import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import * as SiteUtils from 'src/utils/siteUtils'

const SITE_TYPE = SiteType.Cubari

export async function testCubari (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlGuya()
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 166: Squared'
  desired.image = 'https://cdn.discordapp.com/attachments/754390245860048900/814308196620697640/23_-_p000_-_aKraa.jpg'
  desired.title = 'One Punch Man'
  desired.chapterUrl = 'https://cubari.moe/read/gist/OPM/166/1/'
  desired.chapterNum = 166
  desired.chapterDate = '10 days ago'

  mangaEqual(manga, desired)
}

async function readUrlGuya (): Promise<void> {
  const manga = await getMangaInfo('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  const desired = new Manga('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  desired.chapter = 'Everyday Life, Part 1'
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/26/73174.webp'
  desired.title = 'Kaguya-sama: Love is War'
  desired.chapterUrl = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/268/1/'
  desired.chapterNum = 268
  desired.chapterDate = SiteUtils.getDateFromNow('a day ago')

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga('kaguya-sama love is war', SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/26/73174.webp'
  desired.chapter = 'Everyday Life, Part 1'
  desired.url = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/'

  return searchValid(results, desired, 'kaguya-sama: love is war')
}
