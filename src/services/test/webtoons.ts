import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { Platform } from 'src/enums/platformEnum'
import { SiteType } from 'src/enums/siteEnum'
import { getPlatform } from '../platformService'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Webtoons
const QUERY = 'the wolf & red riding hood'

export async function testWebtoons (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  const platform = getPlatform()

  await readUrl(platform, site)
  await readUrlCordova(platform)
  await search(site)
}

async function readUrl (platform: Platform, site: BaseSite): Promise<void> {
  if (platform === Platform.Cordova) return

  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Episode 16'
  desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
  desired.title = 'The Wolf & Red Riding Hood'
  desired.chapterUrl = 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16'
  desired.chapterNum = 16

  mangaEqual(manga, desired)
}

async function readUrlCordova (platform: Platform): Promise<void> {
  if (platform !== Platform.Cordova) return

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

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
  desired.chapter = 'Episode 16'
  desired.url = 'https://www.webtoons.com/episodeList?titleNo=2142'

  return searchValid(results, desired, QUERY)
}
