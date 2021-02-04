import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.ReaperScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'aire'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 12'
    desired.image = 'https://media.reaperscans.com/file/reaperscans/comics/951B222AB3EADADCBB32E241E817845AB609514BC21D2BAD/LMlEbRetOe0yzQorJjR87sMB8021OfFznpjdkaAN.jpeg'
    desired.title = 'Aire'
    desired.chapterUrl = 'https://reaperscans.com/comics/353239-aire/1/12'
    desired.chapterNum = 12

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://media.reaperscans.com/file/reaperscans/comics/951B222AB3EADADCBB32E241E817845AB609514BC21D2BAD/LMlEbRetOe0yzQorJjR87sMB8021OfFznpjdkaAN.jpeg'
    desired.chapter = 'Chapter 12'
    desired.url = 'https://reaperscans.com/comics/353239-aire'

    return search(worker, query, desired)
  })
})
