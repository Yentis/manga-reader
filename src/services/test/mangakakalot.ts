import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Mangakakalot
const QUERY = 'together with the rain'

export async function testMangakakalot(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search()
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 24'
  desired.image = 'https://imgs-2.2xstorage.com/thumb/osananajimi-ni-najimitai.webp'
  desired.title = 'Osananajimi ni najimitai'
  desired.chapterUrl = `${site.getUrl()}/manga/osananajimi-ni-najimitai/chapter-24`
  desired.chapterNum = 24
  desired.chapterDate = '5 months ago'

  mangaEqual(manga, desired)
}

async function search(): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga('', SITE_TYPE)
  desired.image = 'https://imgs-2.2xstorage.com/thumb/together-with-the-rain.webp'
  desired.chapter = 'Chapter 2'
  desired.url = 'https://www.mangakakalot.gg/manga/together-with-the-rain'

  await searchValid(results, desired, QUERY)

  const query2 = 'this song is only for you'
  const results2 = await searchManga(query2, SITE_TYPE)
  const desired2 = new Manga('', SITE_TYPE)
  desired2.image = 'https://imgs-2.2xstorage.com/thumb/this-song-is-only-for-you.webp'
  desired2.chapter = 'Chapter 149.2'
  desired2.url = 'https://www.mangakakalot.gg/manga/this-song-is-only-for-you'

  return searchValid(results2, desired2, query2)
}
