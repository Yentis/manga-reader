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
import {
  Kitsu
} from 'src/classes/sites/kitsu'
import {
  LinkingSiteType
} from '../enums/linkingSiteEnum'
import { AxiosRequestConfig } from 'axios'
import PQueue from 'p-queue'

const requestQueue = new PQueue({ interval: 1000, intervalCap: 20 })
const mangaDex = new MangaDex()
const siteMap = new Map<string, BaseSite>([
  [SiteType.Manganelo, new Manganelo()],
  [SiteType.HatigarmScans, new Genkan(SiteType.HatigarmScans)],
  [SiteType.Webtoons, new Webtoons()],
  [SiteType.FirstKissManga, new WordPress(SiteType.FirstKissManga)],
  [SiteType.MangaKomi, new WordPress(SiteType.MangaKomi)],
  [SiteType.Mangakakalot, new Mangakakalot()],
  [SiteType.MangaDex, mangaDex],
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
const linkingSiteMap = new Map<string, BaseSite>([
  [LinkingSiteType.MangaDex, mangaDex],
  [LinkingSiteType.Kitsu, new Kitsu()]
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
    site.checkLogin().then(() => {
      // Do nothing
    }).catch(() => {
      // Do nothing
    })
  })
}

export function testSite (siteType: SiteType): Promise <Error | Manga> {
  const site = siteMap.get(siteType)
  if (!site) return Promise.reject(Error('Invalid site type'))

  return requestQueue.add(() => site.readUrl(site.getTestUrl()))
}

export function getMangaInfo (url: string, siteType: SiteType | LinkingSiteType): Promise <Error | Manga> {
  const site = siteMap.get(siteType)
  if (!site) return Promise.resolve(Error('Invalid site type'))

  return requestQueue.add(() => site.readUrl(url))
}

export function searchManga (query: string, siteType: SiteType | LinkingSiteType | undefined = undefined): Promise <Manga[]> {
  return requestQueue.add(async () => {
    if (siteType) {
      const site = siteMap.get(siteType) || linkingSiteMap.get(siteType)
      const result = await createRace(site?.search(query) || Promise.reject(Error('Invalid site type')))
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

export function getSite (siteType: SiteType | LinkingSiteType): BaseSite | undefined {
  return siteMap.get(siteType) || linkingSiteMap.get(siteType)
}
