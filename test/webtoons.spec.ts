import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WebtoonsWorker } from '../src/classes/sites/webtoons/webtoonsWorker'

const siteType = SiteType.Webtoons
const worker = new WebtoonsWorker()

describe(SiteName[siteType], function () {
  const testUrl = WebtoonsWorker.testUrl
  const query = 'the wolf & red riding hood'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Episode 16'
    desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
    desired.title = 'The Wolf & Red Riding Hood'
    desired.chapterUrl = 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16'
    desired.chapterNum = 16

    return readUrl(worker, desired, testUrl)
  })

  it('Read URL mobile', () => {
    const url = 'https://m.webtoons.com/en/super-hero/xinker/list?title_no=541'
    const desired = new Manga(url, siteType)
    desired.chapter = 'Epilogue'
    desired.image = 'https://swebtoon-phinf.pstatic.net/20201208_32/1607362598371MvQ4S_JPEG/8_EB9AA1EB80AB_E293A4EABCB9__EB84BD_EB90A3EB80AB_EC86BDE-1.jpg?type=crop540_540'
    desired.title = 'XINK3R'
    desired.chapterUrl = 'https://m.webtoons.com/en/super-hero/xinker/epilogue/viewer?title_no=541&episode_no=223'
    desired.chapterNum = 223

    return readUrl(worker, desired, url)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
    desired.chapter = 'Episode 16'
    desired.url = 'https://www.webtoons.com/episodeList?titleNo=2142'

    return search(worker, query, desired)
  })
})
