import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Mangago
const QUERY = 'kimetsu no yaiba: tomioka giyuu gaiden'

export async function testMangago (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Vol.1 Ch.5  : : Love Supplication Guidance'
  desired.image = 'https://i4.mangapicgallery.com/r/coverlink/rROHYYKHa8HfkSK8mmW4eWJBGaTgrnCog_d0Y_sc68XnD0ocHUlXfyDZTt-I5lBX9PK.jpg?4'
  desired.title = '...curtain'
  desired.chapterUrl = 'https://www.mangago.me/read-manga/curtain/mf/v01/c005/'
  desired.chapterNum = 5
  desired.chapterDate = moment('Jan 14, 2011', 'MMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://i3.mangapicgallery.com/r/coverlink/rROHYYKHa8HiliDzWniyeapxzJzU4oSoQvrAEzs86qJ0-9a9KsW_WCWDR6JmMILwX7iiPFrhc1qQVGKUHxoNO0X_TxZml7V2h2XjXDYSPEeBcveUNZKJki_m9uxZhO_YTR6I5lBX9PK.jpg?4'
  desired.chapter = 'Ch.2'
  desired.url = 'https://www.mangago.me/read-manga/kimetsu_no_yaiba_tomioka_giyuu_gaiden/'

  return searchValid(results, desired, QUERY)
}
