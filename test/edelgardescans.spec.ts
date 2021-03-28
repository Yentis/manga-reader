import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.EdelgardeScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'i stack experience through reading books'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 11'
    desired.image = 'https://edelgardescans.com/storage/comics/162DEBAED5DD0619E648EBDC13EBFBD64FADD1479124734F/w64rsLItGSa0MSXBnICvH7AHj92fhdza6zJNnaMR.png'
    desired.title = 'I Stack Experience Through Reading Books'
    desired.chapterUrl = 'https://edelgardescans.com/comics/713627-i-stack-experience-through-writing-books/1/11'
    desired.chapterNum = 11

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://edelgardescans.com/storage/comics/162DEBAED5DD0619E648EBDC13EBFBD64FADD1479124734F/w64rsLItGSa0MSXBnICvH7AHj92fhdza6zJNnaMR.png'
    desired.chapter = 'Chapter 11'
    desired.url = 'https://edelgardescans.com/comics/713627-i-stack-experience-through-writing-books'

    return search(worker, query, desired)
  })
})
