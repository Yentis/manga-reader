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
import cheerio from 'cheerio'
import { Platform } from 'quasar'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 7.1.2; LEX820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36'

function readManganelo (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data)
      const site = new Manganelo(
        $('.chapter-name').first(),
        $('.info-image img').first(),
        $('.story-info-right h1').first()
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readGenkan (url: string, siteType: SiteType): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data)
      const site = new Genkan(
        $('.list-item.col-sm-3 a').first(),
        $('.media-content').first(),
        $('.text-highlight').first(),
        siteType
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readWebtoons (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    const mobile = url.includes('//m.' + SiteType.WebToons)
    const headers = mobile && Platform.is?.mobile !== true ? {
      common: {
        'User-Agent': MOBILE_USER_AGENT
      }
    } : null

    axios.get(url, { headers }).then(response => {
      const $ = cheerio.load(response.data)

      let site: WebToons
      if (mobile || Platform.is?.mobile === true) {
        site = new WebToons(
          $('.sub_title span').first(),
          $('li[data-episode-no] a').first(),
          $('meta[property="og:image"]').first(),
          $('._btnInfo .subj').first()
        )
      } else {
        site = new WebToons(
          $('#_listUl .subj span').first(),
          $('#_listUl a').first(),
          $('meta[property="og:image"]').first(),
          $('.info .subj').first()
        )
      }

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readWordPress (url: string, siteType: SiteType): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data)
      const site = new WordPress(
        $('.wp-manga-chapter a').first(),
        $('.summary_image img').first(),
        $('.post-title').first(),
        siteType
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readMangakakalot (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data)
      const site = new MangaKakalot(
        $('.chapter-list a').first(),
        $('.manga-info-pic img').first(),
        $('.manga-info-text h1').first()
      )

      resolve(site.buildManga(url))
    }).catch(error => reject(error))
  })
}

function readMangadex (url: string): Promise < Manga > {
  return new Promise((resolve, reject) => {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data)
      const site = new MangaDex(
        $('.chapter-row a').first(),
        $('.row img').first(),
        $('.card-header .mx-1').first()
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
