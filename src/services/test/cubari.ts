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
  desired.chapter = 'Chapter 168: Awakening of the Gods'
  desired.image = 'https://cdn.discordapp.com/attachments/754390245860048900/814308196620697640/23_-_p000_-_aKraa.jpg'
  desired.title = 'One Punch Man'
  desired.chapterUrl = 'https://cubari.moe/read/gist/OPM/168/1/'
  desired.chapterNum = 168
  desired.chapterDate = '8 days ago'

  mangaEqual(manga, desired)
}

async function readUrlGuya (): Promise<void> {
  const manga = await getMangaInfo('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  const desired = new Manga('https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/', SITE_TYPE)
  desired.chapter = 'Chika Fujiwara Really, Really, Really, Really Wants to Eat'
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/26/73174.webp'
  desired.title = 'Kaguya-sama: Love is War'
  desired.chapterUrl = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/271/1/'
  desired.chapterNum = 271
  desired.chapterDate = SiteUtils.getDateFromNow('a day ago')

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga('kaguya-sama love is war', SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://guya.moe/media/manga/Kaguya-Wants-To-Be-Confessed-To/volume_covers/26/73174.webp'
  desired.chapter = 'Chika Fujiwara Really, Really, Really, Really Wants to Eat'
  desired.url = 'https://guya.moe/read/manga/Kaguya-Wants-To-Be-Confessed-To/'

  return searchValid(results, desired, 'kaguya-sama: love is war')
}
