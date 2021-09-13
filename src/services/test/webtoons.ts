import { QVueGlobals } from 'quasar/dist/types'
import { Manga } from 'src/classes/manga'
import { WebtoonsWorker } from 'src/classes/sites/webtoons/webtoonsWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Webtoons
const TEST_URL = WebtoonsWorker.testUrl
const QUERY = 'the wolf & red riding hood'

export async function testWebtoons ($q: QVueGlobals): Promise<void> {
  await readUrl($q)
  await readUrlCordova($q)
  await search()
}

async function readUrl ($q: QVueGlobals): Promise<void> {
  if ($q.platform.is.cordova) return

  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Episode 16'
  desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
  desired.title = 'The Wolf & Red Riding Hood'
  desired.chapterUrl = 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16'
  desired.chapterNum = 16

  mangaEqual(manga, desired)
}

async function readUrlCordova ($q: QVueGlobals): Promise<void> {
  if (!$q.platform.is.cordva) return

  const url = 'https://m.webtoons.com/en/super-hero/xinker/list?title_no=541'
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  desired.chapter = 'Epilogue'
  desired.image = 'https://swebtoon-phinf.pstatic.net/20210127_227/1611710217905Pat8k_JPEG/6Xinker-Mobile-Landing-Page.jpg?type=crop540_540'
  desired.title = 'XINK3R'
  desired.chapterUrl = 'https://m.webtoons.com/en/super-hero/xinker/epilogue/viewer?title_no=541&episode_no=223'
  desired.chapterNum = 223

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
  desired.chapter = 'Episode 16'
  desired.url = 'https://www.webtoons.com/episodeList?titleNo=2142'

  return searchValid(results, desired, QUERY)
}
