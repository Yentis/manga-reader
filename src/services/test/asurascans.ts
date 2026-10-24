import { Manga } from 'src/classes/manga'
import type { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import moment from 'moment'

const SITE_TYPE = SiteType.AsuraScans
const QUERY = 'mookhyang the origin'

export async function testAsuraScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlAdvanced(site)
  await search(site)
}

function chapterUrlEqual(desired: string, actual: string): boolean {
  const getId = (id: string): string => {
    const parts = id.split('/')[4]?.split('-')
    return parts?.[parts.length - 1] ?? ''
  }

  desired = desired.replace(getId(desired), '')
  actual = actual.replace(getId(actual), '')

  return desired === actual
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)

  desired.chapter = 'Chapter 47'
  desired.image = 'https://cdn.asurascans.com/asura-images/covers/mookhyang-the-origin.1f831b.webp'
  desired.title = 'Mookhyang The Origin'
  desired.chapterUrl = 'https://asurascans.com/comics/mookhyang-the-origin-059befe1/chapter/47'
  desired.chapterNum = 47
  desired.chapterDate = moment('2021-08-15T21:19:26Z').fromNow()

  mangaEqual(manga, desired, { chapterUrlEqual })
}

async function readUrlAdvanced(site: BaseSite): Promise<void> {
  const testUrl = `${site.getUrl()}/s/2038`
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)

  desired.chapter = 'Chapter 88'
  desired.image = 'https://cdn.asurascans.com/asura-images/covers/solo-bug-player.e28bc2.webp'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://asurascans.com/comics/solo-bug-player-059befe1/chapter/88'
  desired.chapterNum = 88
  desired.chapterDate = moment('2022-04-17T18:05:45Z').fromNow()

  mangaEqual(manga, desired, { chapterUrlEqual })
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://cdn.asurascans.com/asura-images/covers/mookhyang-the-origin.1f831b.webp'
  desired.chapter = 'Chapter 47'
  desired.url = 'https://asurascans.com/s/1993'

  return searchValid(results, desired, QUERY)
}
