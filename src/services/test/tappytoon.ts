import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Tappytoon
const QUERY = "the reason why raeliana ended up at the duke's mansion"

export async function testTappytoon(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  const chapter = 109

  desired.chapter = `Episode ${chapter}`
  desired.image = 'https://d1ed0vta5mrb00.cloudfront.net/comics/482/thumbnails/b9e789c4-d9c7-4273-bdfd-2c01ec69aedc.jpg'
  desired.title = 'Return Survival'
  desired.chapterUrl = 'https://www.tappytoon.com/en/chapters/157346352'
  desired.chapterNum = chapter
  desired.chapterDate = '4 months ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://image-repository-cdn.tappytoon.com/series/163/ccfd0062-a4bc-44d5-80ce-22f570dc058b.jpg'
  desired.chapter = 'Epilogue 11: Finale'
  desired.url = 'https://www.tappytoon.com/en/book/raeliana'

  return searchValid(results, desired, QUERY)
}
