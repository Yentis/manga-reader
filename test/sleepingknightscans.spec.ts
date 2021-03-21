import 'ts-jest'
import { jest } from '@jest/globals'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

jest.setTimeout(20000)

const siteType = SiteType.SleepingKnightScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'the second coming of gluttony'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Volume 2 Ch. 50'
    desired.image = 'https://skscans.com/storage/comics/5711D2C1EBF9CB908BE86E251DE20C5BB9D987D7A6C0E697/lAehs42BauOdES4SyqMWCgQqT9sFjS3SmMPdC1r7.png'
    desired.title = 'The Second Coming of Gluttony'
    desired.chapterUrl = 'https://skscans.com/comics/608374-the-second-coming-of-gluttony/2/4'
    desired.chapterNum = 50

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://skscans.com/storage/comics/5711D2C1EBF9CB908BE86E251DE20C5BB9D987D7A6C0E697/lAehs42BauOdES4SyqMWCgQqT9sFjS3SmMPdC1r7.png'
    desired.chapter = 'Volume 2 Ch. 50'
    desired.url = 'https://skscans.com/comics/608374-the-second-coming-of-gluttony'

    return search(worker, query, desired)
  })
})
