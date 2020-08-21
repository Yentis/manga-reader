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
import { BaseSite } from '../classes/sites/baseSite'

const siteMap = new Map<SiteType, BaseSite>([
  [SiteType.Manganelo, new Manganelo()],
  [SiteType.KKJScans, new Genkan(SiteType.KKJScans)],
  [SiteType.HatigarmScans, new Genkan(SiteType.HatigarmScans)],
  [SiteType.Webtoons, new Webtoons()],
  [SiteType.FirstKissManga, new WordPress(SiteType.FirstKissManga)],
  [SiteType.MangaKomi, new WordPress(SiteType.MangaKomi)],
  [SiteType.Mangakakalot, new Mangakakalot()],
  [SiteType.MangaDex, new MangaDex()]
])

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
      siteMap.get(siteType)?.search(query).then(result => {
        if (result instanceof Error) {
          reject(result)
        } else {
          resolve(result)
        }
      }).catch(error => reject(error)) || Promise.reject(Error('Invalid site type'))
    })
  } else {
    return new Promise((resolve, reject) => {
      const promises: Promise<Error | Manga[]>[] = []

      siteMap.forEach(site => {
        promises.push(site.search(query))
      })

      Promise.race([
        Promise.all(promises),
        new Promise((resolve, reject) => setTimeout(() => reject(Error('Timed out')), 10000))
      ]).then(results => {
        if (!(results instanceof Array)) {
          reject(Error('Invalid search results'))
          return
        }

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
