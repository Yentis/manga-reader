import 'mocha'
import { Mangago } from '../src/classes/sites/mangago'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import axios from 'axios'
import tough from 'tough-cookie'

const siteType = SiteType.Mangago

describe(SiteName[siteType], function () {
  const site = new Mangago()
  const query = 'kimetsu no yaiba: tomioka giyuu gaiden'

  axiosCookieJarSupport(axios)
  const cookieJar = new tough.CookieJar()

  site.requestConfig = {
    jar: cookieJar,
    withCredentials: true
  }

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Vol.1 Ch.5'
    desired.image = 'http://i6.mangapicgallery.com/r/coverlink/rROHYUm8aBnzo-L7jmKxeVpVAcPItlyo_7uFcU_twRCXnD7oAOrY_iGWGe5a5RDJz46jsLM.jpg?4'
    desired.title = '...curtain'
    desired.chapterUrl = 'http://www.mangago.me/read-manga/curtain/mf/v01/c005/'
    desired.chapterNum = 5

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'http://i4.mangapicgallery.com/r/coverlink/rROHYYKHa8HiliDzWniyeapxzJzU4oSoQvrAEzs86qJ0-9a9KsW_WCWDR6JmMILwX7iiPFrhc1qQVGKUHxoNO0X_TxZml7V2h2XjXDYSPEeBcveUNZKJki_m9uxZhO_YTR6I5lBX9PK.jpg?4'
    desired.chapter = 'Ch.2'
    desired.url = 'http://www.mangago.me/read-manga/kimetsu_no_yaiba_tomioka_giyuu_gaiden/'

    return search(site, query, desired)
  })
})
