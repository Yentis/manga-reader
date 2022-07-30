import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Comikey
const QUERY = 'to be winner'

export async function testComikey (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Episode 114'
  desired.image = 'https://i2.wp.com/comikey.com/media/comics/4orPDQ/621d00480ac3.jpg?fit=500%2C500&quality=95&strip=all'
  desired.title = 'To Be Winner'
  desired.chapterUrl = 'https://comikey.com/read/to-be-winner-webtoon/Po6VBo/episode-114/'
  desired.chapterNum = 114
  desired.chapterDate = '9 months ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://i2.wp.com/comikey.com/media/comics/4orPDQ/621d00480ac3.jpg?fit=500%2C500&quality=95&strip=all'
  desired.chapter = 'Episode 114'
  desired.url = 'https://comikey.com/comics/to-be-winner-webtoon/23/'

  return searchValid(results, desired, QUERY)
}
