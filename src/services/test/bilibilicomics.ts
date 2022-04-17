import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.BiliBiliComics
const QUERY = 'beloved'

export async function testBiliBiliComics (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search()
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = '618 Displaying One’s Prowess(2)'
  desired.image = 'http://i0.hdslb.com/bfs/comic-static/58c0cc6a498b2d8c74e5ca1f283393cd26501e71.png@300w.webp'
  desired.title = 'Tales of Demons and Gods'
  desired.chapterUrl = 'https://www.bilibilicomics.com/mc215/30056'
  desired.chapterNum = 618
  desired.chapterDate = moment('2021-12-02', 'YYYY-MM-DD').fromNow()

  mangaEqual(manga, desired, false)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga('https://www.bilibilicomics.com/detail/mc245', SITE_TYPE)
  desired.image = 'http://i0.hdslb.com/bfs/comic-static/798919b4975940465d33396b4a8a874517caafdd.png@300w.webp'
  desired.chapter = '65 You Won\'t Be Alone in the Future'

  return searchValid(results, desired, 'My Beloved Liu Yu\'an')
}
