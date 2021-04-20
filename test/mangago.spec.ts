import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import axios from 'axios'
import tough from 'tough-cookie'
import { MangagoWorker } from '../src/classes/sites/mangago/mangagoWorker'

const cookieJar = new tough.CookieJar()
axiosCookieJarSupport(axios)

const siteType = SiteType.Mangago
const worker = new MangagoWorker({
  jar: cookieJar,
  withCredentials: true
})

describe(SiteName[siteType], function () {
  const testUrl = MangagoWorker.testUrl
  const query = 'kimetsu no yaiba: tomioka giyuu gaiden'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Vol.1 Ch.5'
    desired.image = 'http://i2.mangapicgallery.com/r/coverlink/rROHYUm8aBnzo-L7jmKxeVpVAcPItlyo_7uFcU_twRCXnD7oAOrY_iGWGe5a5RDJz46jsLM.jpg?4'
    desired.title = '...curtain'
    desired.chapterUrl = 'http://www.mangago.me/read-manga/curtain/mf/v01/c005/'
    desired.chapterNum = 5

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'http://i6.mangapicgallery.com/r/coverlink/rROHYYKHa8HiliDzWniyeapxzJzU4oSoQvrAEzs86qJ0-9a9KsW_WCWDR6JmMILwX7iiPFrhc1qQVGKUHxoNO0X_TxZml7V2h2XjXDYSPEeBcveUNZKJki_m9uxZhO_YTR6I5lBX9PK.jpg?4'
    desired.chapter = 'Ch.2'
    desired.url = 'http://www.mangago.me/read-manga/kimetsu_no_yaiba_tomioka_giyuu_gaiden/'

    return search(worker, query, desired)
  })
})
