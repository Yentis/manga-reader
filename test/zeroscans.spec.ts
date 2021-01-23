import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.ZeroScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'all heavenly days'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 48'
    desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
    desired.title = 'All Heavenly Days'
    desired.chapterUrl = 'https://zeroscans.com/comics/136750-all-heavenly-days/1/48'
    desired.chapterNum = 48

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
    desired.chapter = 'Chapter 48'
    desired.url = 'https://zeroscans.com/comics/136750-all-heavenly-days'

    return search(worker, query, desired)
  })
})
