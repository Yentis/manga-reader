import {
  Manga
} from './classes/manga'
import {
  SiteType
} from './classes/siteType'
import {
  Manganelo
} from './classes/sites/manganelo'
import {
  Genkan
} from './classes/sites/genkan'
import {
  WebToons
} from './classes/sites/webtoons'
import {
  MangaKakalot
} from './classes/sites/mangakakalot'
import {
  MangaDex
} from './classes/sites/mangadex'
import {
  WordPress
} from './classes/sites/wordpress'
import axios from 'axios'
import { Platform } from 'quasar'

function readManganelo (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string
      const site = new Manganelo(
        doc.querySelectorAll('.chapter-name')[0],
        doc.querySelectorAll('.info-image img')[0],
        doc.querySelectorAll('.story-info-right h1')[0]
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readGenkan (url: string, siteType: SiteType): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string
      const site = new Genkan(
        doc.querySelectorAll('.list-item.col-sm-3 a')[0],
        doc.querySelectorAll('.media-content')[0],
        doc.querySelectorAll('.text-highlight')[0],
        siteType
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readWebtoons (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string

      let site: WebToons
      if (Platform.is.mobile) {
        site = new WebToons(
          doc.querySelectorAll('.sub_title span')[0],
          doc.querySelectorAll('li[data-episode-no] a')[0],
          doc.querySelectorAll('meta[property="og:image"]')[0],
          doc.querySelectorAll('._btnInfo .subj')[0]
        )
      } else {
        site = new WebToons(
          doc.querySelectorAll('#_listUl .subj span')[0],
          doc.querySelectorAll('#_listUl a')[0],
          doc.querySelectorAll('meta[property="og:image"]')[0],
          doc.querySelectorAll('.info .subj')[0]
        )
      }

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readWordPress (url: string, siteType: SiteType): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string
      const site = new WordPress(
        doc.querySelectorAll('.wp-manga-chapter a')[0],
        doc.querySelectorAll('.summary_image img')[0],
        doc.querySelectorAll('.post-title')[0],
        siteType
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readMangakakalot (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string
      const site = new MangaKakalot(
        doc.querySelectorAll('.chapter-list a')[0],
        doc.querySelectorAll('.manga-info-pic img')[0],
        doc.querySelectorAll('.manga-info-text h1')[0]
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readMangadex (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const doc = document.createElement('div')
      doc.innerHTML = response.data as string
      const site = new MangaDex(
        doc.querySelectorAll('.chapter-row a')[0],
        doc.querySelectorAll('.row img')[0],
        doc.querySelectorAll('.card-header .mx-1')[0]
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

export function getMangaInfo (url: string, siteType: SiteType): Promise < Manga > {
  switch (siteType) {
    case SiteType.Manganelo:
      return readManganelo(url)
    case SiteType.KkjScans:
      return readGenkan(url, siteType)
    case SiteType.WebToons:
      return readWebtoons(url)
    case SiteType.HatigarmScanz:
      return readGenkan(url, siteType)
    case SiteType.FirstKissManga:
      return readWordPress(url, siteType)
    case SiteType.MangaKakalot:
      return readMangakakalot(url)
    case SiteType.MangaDex:
      return readMangadex(url)
    case SiteType.MangaKomi:
      return readWordPress(url, siteType)
    default:
      return Promise.reject(Error('Invalid site type'))
  }
}
