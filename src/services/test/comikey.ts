import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Comikey
const QUERY = 'fire-hot aunt'

export async function testComikey(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlChapter()
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Episode 113'
  desired.image = 'https://media.comikey.com/gazo/480/jpg/comics/4orPDQ/e58968bd8239.jpg'
  desired.title = 'To Be Winner'
  desired.chapterUrl = 'https://comikey.com/read/to-be-winner-webtoon/dowAND/episode-113/'
  desired.chapterNum = 113
  desired.chapterDate = '4 years ago'

  mangaEqual(manga, desired)
}

async function readUrlChapter(): Promise<void> {
  const manga = await getMangaInfo('https://comikey.com/comics/demon-lord-got-remarried-manga/37/', SITE_TYPE)
  const desired = new Manga('https://comikey.com/comics/demon-lord-got-remarried-manga/37/', SITE_TYPE)
  desired.chapter = 'Chapter 52'
  desired.image = 'https://media.comikey.com/gazo/480/jpg/comics/2oLlo8/5a831352c75c.png'
  desired.title = "I'm a Demon Lord. I Got Remarried to the Mother of a Hero, So She Became My Step-Daughter"
  desired.chapterUrl = 'https://comikey.com/read/demon-lord-got-remarried-manga/kEZzXD/chapter-52/'
  desired.chapterNum = 52

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://media.comikey.com/gazo/480/jpg/comics/yk7Eve/127326e97187.png'
  desired.chapter = 'Volume 11: Chapters 41 to 44'
  desired.url = 'https://comikey.com/comics/fire-hot-aunt-manga/563/'

  return searchValid(results, desired, QUERY)
}
