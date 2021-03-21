import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { BatotoWorker } from '../src/classes/sites/batoto/batotoWorker'

const siteType = BatotoWorker.siteType
const worker = new BatotoWorker()

describe(SiteName[siteType], function () {
  const testUrl = BatotoWorker.testUrl
  const query = 'I found somebody to love'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 143 [END]'
    desired.image = 'https://xcdn-000.animemark.com/acg_covers/W600/7a/59/7a59cd95c70b6214422a67f19012daa349f01d6e_263328_720_1020.jpg'
    desired.title = 'Doctor Elise: The Royal Lady with the Lamp'
    desired.chapterUrl = 'https://bato.to/chapter/1629009'
    desired.chapterNum = 143

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://xcdn-000.animemark.com/acg_covers/W300/cd/43/cd43759af3efabf4e16729443a0244b9d76df0fe_295421_420_610.jpg'
    desired.chapter = 'Ch.88'
    desired.url = 'https://bato.to/series/75371/i-found-somebody-to-love'

    return search(worker, query, desired)
  })
})
