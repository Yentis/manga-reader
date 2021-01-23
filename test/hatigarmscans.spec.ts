import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.HatigarmScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'ichizu de bitch na kouhai'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 5'
    desired.image = 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg'
    desired.title = 'Ichizu de Bitch na Kouhai'
    desired.chapterUrl = 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5'
    desired.chapterNum = 5

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg'
    desired.chapter = 'Chapter 5'
    desired.url = 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai'

    return search(worker, query, desired)
  })
})
