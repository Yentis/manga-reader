import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.FirstKissManga
const QUERY = 'the elegant sea of savagery'

export async function testFirstKissManga (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 57

  desired.chapter = `Chapter ${chapter}`
  desired.image = 'https://1stkissmanga.me/wp-content/uploads/the-elegant-sea-of-savagery-121533-1872-193x278.jpg'
  desired.title = 'The Elegant Sea of Savagery'
  desired.chapterUrl = `https://1stkissmanga.me/manga/the-elegant-sea-of-savagery/chapter-${chapter}/`
  desired.chapterNum = chapter
  desired.chapterDate = '7 days ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://1stkissmanga.me/wp-content/uploads/the-elegant-sea-of-savagery-121533-1872-193x278.jpg'
  desired.chapter = 'Chapter 57'
  desired.url = 'https://1stkissmanga.me/manga/the-elegant-sea-of-savagery/'

  return searchValid(results, desired, QUERY)
}
