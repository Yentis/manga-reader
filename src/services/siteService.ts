import {
  Manga
} from '../classes/manga'
import {
  SiteType
} from '../enums/siteEnum'
import {
  Manganelo
} from '../classes/sites/manganelo'
import {
  Genkan
} from '../classes/sites/genkan'
import {
  Webtoons
} from '../classes/sites/webtoons'
import {
  Mangakakalot
} from '../classes/sites/mangakakalot'
import {
  MangaDex
} from '../classes/sites/mangadex'
import {
  WordPress
} from '../classes/sites/wordpress'
import {
  BaseSite
} from '../classes/sites/baseSite'
import {
  AsuraScans
} from '../classes/sites/asurascans'
import {
  Mangago
} from '../classes/sites/mangago'
import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import PQueue from 'p-queue'

const requestQueue = new PQueue({ interval: 1000, intervalCap: 20 })
const siteMap = new Map<SiteType, BaseSite>([
  [SiteType.Manganelo, new Manganelo()],
  [SiteType.HatigarmScans, new Genkan(SiteType.HatigarmScans)],
  [SiteType.Webtoons, new Webtoons()],
  [SiteType.FirstKissManga, new WordPress(SiteType.FirstKissManga)],
  [SiteType.MangaKomi, new WordPress(SiteType.MangaKomi)],
  [SiteType.Mangakakalot, new Mangakakalot()],
  [SiteType.MangaDex, new MangaDex()],
  [SiteType.MethodScans, new Genkan(SiteType.MethodScans)],
  [SiteType.LeviatanScans, new Genkan(SiteType.LeviatanScans)],
  [SiteType.HiperDEX, new WordPress(SiteType.HiperDEX)],
  [SiteType.ReaperScans, new Genkan(SiteType.ReaperScans)],
  [SiteType.MangaDoDs, new WordPress(SiteType.MangaDoDs)],
  [SiteType.AsuraScans, new AsuraScans()],
  [SiteType.ManhwaClub, new WordPress(SiteType.ManhwaClub)],
  [SiteType.MangaTx, new WordPress(SiteType.MangaTx)],
  [SiteType.Mangago, new Mangago()]
])

function createRace (promise: Promise<Error | Manga[]>): Promise<Error | Manga[]> {
  const timeoutPromise: Promise<Error | Manga[]> = new Promise(resolve => setTimeout(() => resolve(Error('Timed out')), 10000))
  return Promise.race([
    promise,
    timeoutPromise
  ])
}

export function setRequestConfig (requestConfig: AxiosRequestConfig) {
  siteMap.forEach(site => {
    site.requestConfig = requestConfig
  })
}

export function checkLogins (): void {
  siteMap.forEach(site => {
    site.checkLogin()
  })
}

export function testSite (siteType: SiteType): Promise <Error | Manga> {
  const site = siteMap.get(siteType)
  if (!site) return Promise.reject(Error('Invalid site type'))

  return requestQueue.add(() => site.readUrl(site.getTestUrl()))
}

export function getMangaInfo (url: string, siteType: SiteType): Promise <Error | Manga> {
  const site = siteMap.get(siteType)
  if (!site) return Promise.resolve(Error('Invalid site type'))

  return requestQueue.add(() => site.readUrl(url))
}

export function searchManga (query: string, siteType: SiteType | undefined = undefined): Promise <Manga[]> {
  return requestQueue.add(async () => {
    if (siteType) {
      const result = await createRace(siteMap.get(siteType)?.search(query) || Promise.reject(Error('Invalid site type')))
      if (result instanceof Error) {
        throw result
      } else {
        return result
      }
    } else {
      const promises: Promise<Error | Manga[]>[] = []

      siteMap.forEach(site => {
        promises.push(createRace(site.search(query)))
      })

      const results = await Promise.all(promises)
      let mangaResults: Manga[] = []

      for (const mangaList of results) {
        if (mangaList instanceof Error) continue
        mangaResults = mangaResults.concat(mangaList)
      }

      return mangaResults
    }
  })
}

export function getSiteMap () {
  return siteMap
}

export function syncReadChapter (id: number, chapterNum: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (chapterNum === 0) {
      resolve()
      return
    }

    const data = new FormData()
    data.append('volume', '0')
    data.append('chapter', chapterNum)

    axios({
      method: 'post',
      url: `https://mangadex.org/ajax/actions.ajax.php?function=edit_progress&id=${id}`,
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      },
      data
    }).then(response => {
      if (response.data === '') {
        resolve()
      } else {
        reject(Error(response.data))
      }
    }).catch(error => {
      reject(error)
    })
  })
}
