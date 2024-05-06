import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.LuminousScans
const QUERY = 'legend of the northern blade'

export async function testLuminousScans(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter Epilogue Ch 03 [End]'
  desired.image = `${site.getUrl()}/wp-content/uploads/2021/05/My_Office_Noona_Story_Title-1.jpg`
  desired.title = 'My Office Noona’s Story'
  desired.chapterUrl = `${site.getUrl()}/1706860801-my-office-noonas-story-epilogue-chapter-03/`
  desired.chapterNum = 64
  desired.chapterDate = '2 years ago'

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = `${site.getUrl()}/wp-content/uploads/2021/07/LONBAnimGif1-212x300.gif`
  desired.chapter = '187'
  desired.url = `${site.getUrl()}/series?p=5424`

  await searchValid(results, desired, QUERY)
}
