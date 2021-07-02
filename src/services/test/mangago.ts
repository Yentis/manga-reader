import { Manga } from 'src/classes/manga'
import { MangagoWorker } from 'src/classes/sites/mangago/mangagoWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Mangago
const TEST_URL = MangagoWorker.testUrl
const QUERY = 'kimetsu no yaiba: tomioka giyuu gaiden'

export async function testMangago (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Vol.1 Ch.5  : : Love Supplication Guidance'
  desired.image = 'https://i1.mangapicgallery.com/r/coverlink/rROHYUm8aBnzo-L7jmKxeVpVAcPItlyo_7uFcU_twRCXnD7oAOrY_iGWGe5a5RDJz46jsLM.jpg?4'
  desired.title = '...curtain'
  desired.chapterUrl = 'https://www.mangago.me/read-manga/curtain/mf/v01/c005/'
  desired.chapterNum = 5

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://i3.mangapicgallery.com/r/coverlink/rROHYYKHa8HiliDzWniyeapxzJzU4oSoQvrAEzs86qJ0-9a9KsW_WCWDR6JmMILwX7iiPFrhc1qQVGKUHxoNO0X_TxZml7V2h2XjXDYSPEeBcveUNZKJki_m9uxZhO_YTR6I5lBX9PK.jpg?4'
  desired.chapter = 'Ch.2'
  desired.url = 'https://www.mangago.me/read-manga/kimetsu_no_yaiba_tomioka_giyuu_gaiden/'

  return searchValid(results, desired, QUERY)
}
