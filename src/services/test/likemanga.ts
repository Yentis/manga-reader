import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LikeManga
const QUERY = 'the elegant sea of savagery'

export async function testLikeManga(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 61

  desired.chapter = `Chapter ${chapter}`
  desired.image =
    'https://likemanga.io/upload/pages/2023/08/1691374019-64d051c30c110-theelegantseaofsavagery1215331872193x278.jpg'
  desired.title = 'The Elegant Sea of Savagery'
  desired.chapterUrl = 'https://likemanga.io/the-elegant-sea-of-savagery-1615/chapter-61-317149/'
  desired.chapterNum = chapter
  desired.chapterDate = '3 months ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image =
    'https://likemanga.io/upload/pages/2023/08/1691374019-64d051c30c110-theelegantseaofsavagery1215331872193x278.jpg'
  desired.chapter = 'Chapter 61'
  desired.url = 'https://likemanga.io/the-elegant-sea-of-savagery-1615/'

  return searchValid(results, desired, QUERY)
}
