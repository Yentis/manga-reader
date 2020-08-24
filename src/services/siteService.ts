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

const siteMap = new Map<SiteType, BaseSite>([
  [SiteType.Manganelo, new Manganelo()],
  [SiteType.KKJScans, new Genkan(SiteType.KKJScans)],
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
  [SiteType.MangaDoDs, new WordPress(SiteType.MangaDoDs)]
])

function createRace (promise: Promise<Error | Manga[]>): Promise<Error | Manga[]> {
  const timeoutPromise: Promise<Error | Manga[]> = new Promise(resolve => setTimeout(() => resolve(Error('Timed out')), 10000))
  return Promise.race([
    promise,
    timeoutPromise
  ])
}

export function checkLogins (): void {
  siteMap.forEach(site => {
    site.checkLogin()
  })
}

export function getMangaInfo (url: string, siteType: SiteType): Promise < Manga > {
  return siteMap.get(siteType)?.readUrl(url) || Promise.reject(Error('Invalid site type'))
}

export function searchManga (query: string, siteType: SiteType | undefined = undefined): Promise < Manga[] > {
  if (siteType) {
    return new Promise((resolve, reject) => {
      createRace(siteMap.get(siteType)?.search(query) || Promise.reject(Error('Invalid site type'))).then(result => {
        if (result instanceof Error) {
          reject(result)
        } else {
          resolve(result)
        }
      }).catch(error => reject(error))
    })
  } else {
    return new Promise((resolve, reject) => {
      const promises: Promise<Error | Manga[]>[] = []

      siteMap.forEach(site => {
        promises.push(createRace(site.search(query)))
      })

      Promise.all(promises).then(results => {
        let mangaResults: Manga[] = []

        for (const mangaList of results) {
          if (mangaList instanceof Error) continue
          mangaResults = mangaResults.concat(mangaList)
        }

        resolve(mangaResults)
      }).catch(error => reject(error))
    })
  }
}

export function getSiteMap () {
  return siteMap
}
