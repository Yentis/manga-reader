import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.SleepingKnightScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'the second coming of gluttony'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'End of Season 1'
    desired.image = 'https://skscans.com/storage/comics/5711D2C1EBF9CB908BE86E251DE20C5BB9D987D7A6C0E697/PH4Zw42npb2wtvIsVNpzfAkGXP8NLDIw6a98BwkI.jpeg'
    desired.title = 'The Second Coming of Gluttony'
    desired.chapterUrl = 'https://skscans.com/comics/608374-the-second-coming-of-gluttony/1/46'
    desired.chapterNum = 46

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://skscans.com/storage/comics/5711D2C1EBF9CB908BE86E251DE20C5BB9D987D7A6C0E697/PH4Zw42npb2wtvIsVNpzfAkGXP8NLDIw6a98BwkI.jpeg'
    desired.chapter = 'End of Season 1'
    desired.url = 'https://skscans.com/comics/608374-the-second-coming-of-gluttony'

    return search(worker, query, desired)
  })
})
