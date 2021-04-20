import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanioWorker } from '../src/classes/sites/genkanio/genkanioWorker'

const siteType = GenkanioWorker.siteType
const worker = new GenkanioWorker()

describe(SiteName[siteType], function () {
  const testUrl = GenkanioWorker.testUrl
  const query = 'the great mage returns'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Castle Chapter 58'
    desired.image = 'https://images.weserv.nl/?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg'
    desired.title = 'Castle'
    desired.chapterUrl = 'https://genkan.io/manga/8383424626-castle/chapters/3490'
    desired.chapterNum = 58

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://images.weserv.nl/?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fc932b0c7-a984-4ab6-8be5-47ea047bd692%2FEPFMyb0jOeUgvR32oPLTreUihBF34jfdc96jJMA1.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fc932b0c7-a984-4ab6-8be5-47ea047bd692%2FEPFMyb0jOeUgvR32oPLTreUihBF34jfdc96jJMA1.jpg'
    desired.chapter = '77'
    desired.url = 'https://genkan.io/manga/2829584385-the-great-mage-returns-after-4000-years'

    return search(worker, query, desired)
  })
})
