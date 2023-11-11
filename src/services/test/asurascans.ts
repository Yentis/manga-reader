import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.AsuraScans
const QUERY = 'mookhyang the origin'

export async function testAsuraScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlAdvanced()
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 47'
  desired.image =
    'https://img.asuracomics.com/unsafe/fit-in/720x936/https://asuratoon.com/wp-content/uploads/2021/02/ponytail_boy_.png'
  desired.title = 'Mookhyang The Origin'
  desired.chapterUrl = 'https://asuratoon.com/2970937220-mookhyang-the-origin-chapter-47/'
  desired.chapterNum = 47
  desired.chapterDate = '2 years ago'

  mangaEqual(manga, desired)
}

async function readUrlAdvanced(): Promise<void> {
  const testUrl = 'https://asuratoon.com/?p=36093'
  const manga = await getMangaInfo(testUrl, SITE_TYPE)
  const desired = new Manga(testUrl, SITE_TYPE)
  desired.chapter = 'Chapter 88'
  desired.image =
    'https://img.asuracomics.com/unsafe/fit-in/720x936/https://asuratoon.com/wp-content/uploads/2021/02/cover4.gif'
  desired.title = 'Solo Bug Player'
  desired.chapterUrl = 'https://asuratoon.com/2970937220-solo-bug-player-chapter-88/'
  desired.chapterNum = 88

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://asuratoon.com/wp-content/uploads/2021/02/ponytail_boy_-222x300.png'
  desired.chapter = '47'
  desired.url = 'https://asuratoon.com/?p=36483'

  return searchValid(results, desired, QUERY)
}
