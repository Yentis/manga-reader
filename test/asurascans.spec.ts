import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { AsuraScansWorker } from '../src/classes/sites/asura/asurascansWorker'

const siteType = AsuraScansWorker.siteType
const worker = new AsuraScansWorker()

describe(SiteName[siteType], function () {
  const testUrl = AsuraScansWorker.testUrl
  const query = 'tougen anki'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 19'
    desired.image = 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg'
    desired.title = 'Tougen Anki'
    desired.chapterUrl = 'https://asurascans.com/tougen-anki-chapter-19/'
    desired.chapterNum = 19

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg?h=80'
    desired.chapter = '19'
    desired.url = 'https://asurascans.com/comics/tougen-anki/'

    return search(worker, query, desired)
  })
})
