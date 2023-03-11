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
  desired.chapter = 'Chapter 48'
  desired.image = 'https://1stkissmanga.me/wp-content/uploads/the-elegant-sea-of-savagery-121533-193x278.jpg'
  desired.title = 'The Elegant Sea of Savagery'
  desired.chapterUrl = 'https://1stkissmanga.me/manga/the-elegant-sea-of-savagery/chapter-48/'
  desired.chapterNum = 48
  desired.chapterDate = '2 months ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://1stkissmanga.me/wp-content/uploads/the-elegant-sea-of-savagery-121533-193x278.jpg'
  desired.chapter = 'Chapter 48'
  desired.url = 'https://1stkissmanga.me/manga/the-elegant-sea-of-savagery/'

  return searchValid(results, desired, QUERY)
}
