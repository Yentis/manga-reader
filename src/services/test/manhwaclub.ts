import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ManhwaClub
const QUERY = 'cram school scandal'

export async function testManhwaClub (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 35'
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/814.jpg'
  desired.title = 'Movies Are Real'
  desired.chapterUrl = 'https://manhwa.club/comic/movies-are-real/chapter-35/reader'
  desired.chapterNum = 35
  desired.chapterDate = '16 days ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://cdn.manhwa.club/mhc/storage/comics/thumbs/41.jpg'
  desired.chapter = 'Chapter 30'
  desired.url = 'https://manhwa.club/comic/cram-school-scandal'

  return searchValid(results, desired, QUERY)
}
