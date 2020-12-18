import 'mocha'
import 'jsdom-global'
import { setRequestConfig, getMangaInfo, searchManga, testSite } from '../src/services/siteService'
import { SiteType } from '../src/enums/siteEnum'
import { Manga } from '../src/classes/manga'
import axios from 'axios'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import tough from 'tough-cookie'

axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()
const DEV = false

setRequestConfig({
  jar: cookieJar,
  withCredentials: true
})

if (DEV) {
  describe('Dev', function () {
    this.timeout(10000)

    it(SiteType.Mangago, () => {
      return testSearchMangago()
    })
  })
} else {
  describe('Read url', function () {
    this.timeout(10000)

    it(SiteType.Manganelo, () => {
      return testManganelo()
    })

    it(SiteType.Webtoons, () => {
      return testWebtoons()
    })

    it(`m.${SiteType.Webtoons}`, () => {
      return testWebtoonsMobile()
    })

    it(SiteType.HatigarmScans, () => {
      return testHatigarmScans()
    })

    it(SiteType.FirstKissManga, () => {
      return testFirstkissmanga()
    })

    it(SiteType.Mangakakalot, () => {
      return testMangakakalot()
    })

    it(SiteType.MangaDex, () => {
      return testMangadex()
    })

    it(SiteType.MangaKomi, () => {
      return testMangakomi()
    })

    it(SiteType.MethodScans, () => {
      return testMethodScans()
    })

    it(SiteType.LeviatanScans, () => {
      return testLeviatanScans()
    })

    it(SiteType.HiperDEX, () => {
      return testHiperDEX()
    })

    it(SiteType.ReaperScans, () => {
      return testReaperScans()
    })

    it(SiteType.MangaDoDs, () => {
      return testMangaDoDs()
    })

    it(SiteType.AsuraScans, () => {
      return testAsuraScans()
    })

    it(SiteType.ManhwaClub, () => {
      return testManhwaClub()
    })

    it(SiteType.MangaTx, () => {
      return testMangaTx()
    })

    it(SiteType.Mangago, () => {
      return testMangago()
    })
  })

  describe('Search query', function () {
    this.timeout(10000)

    it(SiteType.Manganelo, () => {
      return testSearchManganelo()
    })

    it(SiteType.Webtoons, () => {
      return testSearchWebtoons()
    })

    it(SiteType.HatigarmScans, () => {
      return testSearchHatigarmScans()
    })

    it(SiteType.FirstKissManga, () => {
      return testSearchFirstKissManga()
    })

    it(SiteType.Mangakakalot, () => {
      return testSearchMangakakalot()
    })

    // Doesn't work, need session token
    /* it(SiteType.MangaDex, () => {
      return testSearchMangaDex()
    }) */

    it(SiteType.MangaKomi, () => {
      return testSearchMangaKomi()
    })

    it(SiteType.MethodScans, () => {
      return testSearchMethodScans()
    })

    it(SiteType.LeviatanScans, () => {
      return testSearchLeviatanScans()
    })

    it(SiteType.HiperDEX, () => {
      return testSearchHiperDEX()
    })

    it(SiteType.ReaperScans, () => {
      return testSearchReaperScans()
    })

    it(SiteType.MangaDoDs, () => {
      return testSearchMangaDoDs()
    })

    it(SiteType.AsuraScans, () => {
      return testSearchAsuraScans()
    })

    it(SiteType.ManhwaClub, () => {
      return testSearchManhwaClub()
    })

    it(SiteType.MangaTx, () => {
      return testSearchMangaTx()
    })

    it(SiteType.Mangago, () => {
      return testSearchMangago()
    })
  })
}

function equals (
  actual: Manga | Error,
  desired: Manga
): Error | boolean {
  if (actual instanceof Error) return actual

  if (actual.url !== desired.url) return Error(`Expected url: ${desired.url} | Actual: ${actual.url}`)
  else if (actual.site !== desired.site) return Error(`Expected site: ${desired.site} | Actual: ${actual.site}`)
  else if (actual.chapter !== desired.chapter) return Error(`Expected chapter: ${desired.chapter} | Actual: ${actual.chapter}`)
  else if (actual.image !== desired.image) return Error(`Expected image: ${desired.image} | Actual: ${actual.image}`)
  else if (actual.title !== desired.title) return Error(`Expected title: ${desired.title} | Actual: ${actual.title}`)
  else if (actual.chapterUrl !== desired.chapterUrl) return Error(`Expected chapter url: ${desired.chapterUrl} | Actual: ${actual.chapterUrl}`)
  else if (actual.read !== desired.read) return Error(`Expected read: ${desired.read || 'undefined'} | Actual: ${actual.read || 'undefined'}`)
  else if (actual.readUrl !== desired.read) return Error(`Expected read url: ${desired.readUrl || 'undefined'} | Actual: ${actual.readUrl || 'undefined'}`)
  else if (!actual.chapterDate.includes('ago')) return Error('Chapter date not valid')
  else if (actual.chapterNum !== desired.chapterNum) return Error(`Expected chapter num: ${desired.chapterNum} | Actual: ${actual.chapterNum}`)
  else return true
}

function testManganelo (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.Manganelo

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://manganelo.com/manga/pu918807', site)
      desired.chapter = 'Vol.6 Chapter 57: The Final Chapter'
      desired.image = 'https://avt.mkklcdnv6.com/8/x/18-1583497426.jpg'
      desired.title = 'Kudan No Gotoshi'
      desired.chapterUrl = 'https://manganelo.com/chapter/pu918807/chapter_57'
      desired.chapterNum = 57

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testWebtoons (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.Webtoons

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142', site)
      desired.chapter = 'Episode 16'
      desired.image = 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540'
      desired.title = 'The Wolf & Red Riding Hood'
      desired.chapterUrl = 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16'
      desired.chapterNum = 16

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testWebtoonsMobile (): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = 'https://m.webtoons.com/en/super-hero/xinker/list?title_no=541'
    const site = SiteType.Webtoons

    getMangaInfo(url, site).then(mangaInfo => {
      const desired = new Manga(url, site)
      desired.chapter = 'Epilogue'
      desired.image = 'https://swebtoon-phinf.pstatic.net/20201208_32/1607362598371MvQ4S_JPEG/8_EB9AA1EB80AB_E293A4EABCB9__EB84BD_EB90A3EB80AB_EC86BDE-1.jpg?type=crop540_540'
      desired.title = 'XINK3R'
      desired.chapterUrl = 'https://m.webtoons.com/en/super-hero/xinker/epilogue/viewer?title_no=541&episode_no=223'
      desired.chapterNum = 223

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testHatigarmScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.HatigarmScans

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai', site)
      desired.chapter = 'Chapter 5'
      desired.image = 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg'
      desired.title = 'Ichizu de Bitch na Kouhai'
      desired.chapterUrl = 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5'
      desired.chapterNum = 5

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testFirstkissmanga (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.FirstKissManga

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://1stkissmanga.com/manga/ripples-of-love/', site)
      desired.chapter = 'Chapter 99'
      desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Hades-Delivery-Shop-193x278.jpg'
      desired.title = 'Ripples Of Love'
      desired.chapterUrl = 'https://1stkissmanga.com/manga/ripples-of-love/chapter-99/'
      desired.chapterNum = 99

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangakakalot (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.Mangakakalot

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://mangakakalot.com/manga/ui921789', site)
      desired.chapter = 'Vol.3 Chapter 22: The Great Tehonbiki Gamble, Part 9'
      desired.image = 'https://avt.mkklcdnv6.com/19/k/20-1583501770.jpg'
      desired.title = 'Legend of the End-of-Century Gambling Wolf Saga'
      desired.chapterUrl = 'https://mangakakalot.com/chapter/ui921789/chapter_22'
      desired.chapterNum = 22

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangadex (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.MangaDex

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://mangadex.org/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored', site)
      desired.chapter = 'Vol. 24 Ch. 95 - World of Stars and Stripes - Outro'
      desired.image = 'https://mangadex.org/images/manga/6272.jpg?1531150797'
      desired.title = 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)'
      desired.chapterUrl = 'https://mangadex.org/chapter/24552'
      desired.chapterNum = 95

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangakomi (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.MangaKomi

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://mangakomi.com/manga/good-night/', site)
      desired.chapter = 'Chapter 34 - The End'
      desired.image = 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432.png'
      desired.title = 'Good Night'
      desired.chapterUrl = 'https://mangakomi.com/manga/good-night/chapter-34/'
      desired.chapterNum = 34

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMethodScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.MethodScans

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://methodscans.com/comics/773532-meng-shi-zai-shang', site)
      desired.chapter = 'Yuan Yuan is as sharp as ever'
      desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
      desired.title = 'Meng Shi Zai Shang'
      desired.chapterUrl = 'https://methodscans.com/comics/773532-meng-shi-zai-shang/1/172'
      desired.chapterNum = 172

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testLeviatanScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.LeviatanScans

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://leviatanscans.com/comics/909261-stresser', site)
      desired.chapter = 'Chapter 8'
      desired.image = 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg'
      desired.title = 'Stresser'
      desired.chapterUrl = 'https://leviatanscans.com/comics/909261-stresser/1/8'
      desired.chapterNum = 8

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testHiperDEX (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.HiperDEX

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://hiperdex.com/manga/arata-primal-the-new-primitive/', site)
      desired.chapter = '35 [END]'
      desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Arata-Primal-193x278.jpg'
      desired.title = 'Arata Primal'
      desired.chapterUrl = 'https://hiperdex.com/manga/arata-primal-the-new-primitive/35-end/'
      desired.chapterNum = 35

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testReaperScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.ReaperScans

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://reaperscans.com/comics/621295-alpha', site)
      desired.chapter = 'End'
      desired.image = 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg'
      desired.title = 'ALPHA'
      desired.chapterUrl = 'https://reaperscans.com/comics/621295-alpha/1/20'
      desired.chapterNum = 20

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangaDoDs (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.MangaDoDs

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://www.mangadods.com/manga/flower-war/', site)
      desired.chapter = '22 END'
      desired.image = 'https://www.mangadods.com/wp-content/uploads/2020/02/12-193x278.jpg'
      desired.title = 'Flower War'
      desired.chapterUrl = 'https://www.mangadods.com/manga/flower-war/22-end/'
      desired.chapterNum = 22

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testAsuraScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.AsuraScans

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://asurascans.com/manga/tougen-anki/', site)
      desired.chapter = 'Chapter 19'
      desired.image = 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg'
      desired.title = 'Tougen Anki'
      desired.chapterUrl = 'https://asurascans.com/tougen-anki-chapter-19/'
      desired.chapterNum = 19

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testManhwaClub (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.ManhwaClub

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://manhwa.club/manhwa/settia/', site)
      desired.chapter = 'Chapter 25'
      desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
      desired.title = 'Settia'
      desired.chapterUrl = 'https://manhwa.club/manhwa/settia/chapter-25'
      desired.chapterNum = 25

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangaTx (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.MangaTx

    testSite(site).then(mangaInfo => {
      const desired = new Manga('https://mangatx.com/manga/grandest-wedding/', site)
      desired.chapter = 'Chapter 169 [End]'
      desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
      desired.title = 'Grandest Wedding'
      desired.chapterUrl = 'https://mangatx.com/manga/grandest-wedding/chapter-169-end/'
      desired.chapterNum = 169

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testMangago (): Promise<void> {
  return new Promise((resolve, reject) => {
    const site = SiteType.Mangago

    testSite(site).then(mangaInfo => {
      const desired = new Manga('http://www.mangago.me/read-manga/curtain/', site)
      desired.chapter = 'Vol.1 Ch.5'
      desired.image = 'http://i6.mangapicgallery.com/r/coverlink/rROHYUm8aBnzo-L7jmKxeVpVAcPItlyo_7uFcU_twRCXnD7oAOrY_iGWGe5a5RDJz46jsLM.jpg?4'
      desired.title = '...curtain'
      desired.chapterUrl = 'http://www.mangago.me/read-manga/curtain/mf/v01/c005/'
      desired.chapterNum = 5

      const result = equals(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

function testSearchManganelo (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('together with the rain', SiteType.Manganelo).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.Manganelo &&
              manga.title === 'together with the rain' &&
              manga.image === 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg' &&
              manga.chapter === 'Chapter 2: That’s what\'s unfair about you! [END]' &&
              manga.url === 'https://manganelo.com/manga/pg923760'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchWebtoons (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('the wolf & red riding hood', SiteType.Webtoons).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.Webtoons &&
              manga.title === 'The Wolf & Red Riding Hood' &&
              manga.image === 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540' &&
              manga.chapter === 'Episode 16' &&
              manga.url === 'https://www.webtoons.com/episodeList?titleNo=2142'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 2) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchHatigarmScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('ichizu de bitch na kouhai', SiteType.HatigarmScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.HatigarmScans &&
              manga.title === 'Ichizu de Bitch na Kouhai' &&
              manga.image === 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg' &&
              manga.chapter === 'Chapter 5' &&
              manga.url === 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchFirstKissManga (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('cajole a childe into being my boyfriend', SiteType.FirstKissManga).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.FirstKissManga &&
              manga.title === 'Cajole a Childe Into Being My Boyfriend' &&
              manga.image === 'https://1stkissmanga.com/wp-content/uploads/2019/12/Cajole-a-Childe-Into-Being-My-Boyfriend-193x278.jpg' &&
              manga.chapter === 'Chapter 155' &&
              manga.url === 'https://1stkissmanga.com/manga/cajole-a-childe-into-being-my-boyfriend/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMangakakalot (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('together with the rain', SiteType.Mangakakalot).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.Mangakakalot &&
              manga.title === 'together with the rain' &&
              manga.image === 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg' &&
              manga.chapter === 'Chapter 2: That’s What\'s Unfair About You! [END]' &&
              manga.url === 'https://mangakakalot.com/manga/pg923760'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

/* function testSearchMangaDex (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('together with the rain', SiteType.MangaDex).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MangaDex &&
              manga.title === 'Together with the Rain' &&
              manga.image === 'https://mangadex.org/images/manga/52590.jpg?1596841158' &&
              manga.chapter === 'Ch. 2 - That’s what\'s unfair about you!' &&
              manga.url === 'https://mangadex.org/title/52590/together-with-the-rain'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
} */

function testSearchMangaKomi (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('nanatsu no taizai', SiteType.MangaKomi).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MangaKomi &&
              manga.title === 'Nanatsu no Taizai' &&
              manga.image === 'https://mangakomi.com/wp-content/uploads/2020/03/thumb_5e5c4904a9158.jpg' &&
              manga.chapter === 'Chapter 346.6' &&
              manga.url === 'https://mangakomi.com/manga/nanatsu-no-taizai/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 2) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMethodScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('meng shi zai shang', SiteType.MethodScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MethodScans &&
              manga.title === 'Meng Shi Zai Shang' &&
              manga.image === 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png' &&
              manga.chapter === 'Yuan Yuan is as sharp as ever' &&
              manga.url === 'https://methodscans.com/comics/773532-meng-shi-zai-shang'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchLeviatanScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('stresser', SiteType.LeviatanScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.LeviatanScans &&
              manga.title === 'Stresser' &&
              manga.image === 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg' &&
              manga.chapter === 'Chapter 8' &&
              manga.url === 'https://leviatanscans.com/comics/909261-stresser'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchHiperDEX (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('cabalist', SiteType.HiperDEX).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.HiperDEX &&
              manga.title === 'Cabalist' &&
              manga.image === 'https://hiperdex.com/wp-content/uploads/2020/04/Cabalist-193x278.jpg' &&
              manga.chapter === '44 [END]' &&
              manga.url === 'https://hiperdex.com/manga/cabalistin/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchReaperScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('alpha', SiteType.ReaperScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.ReaperScans &&
              manga.title === 'ALPHA' &&
              manga.image === 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg' &&
              manga.chapter === 'End' &&
              manga.url === 'https://reaperscans.com/comics/621295-alpha'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMangaDoDs (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('flower war', SiteType.MangaDoDs).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MangaDoDs &&
              manga.title === 'Flower War' &&
              manga.image === 'https://www.mangadods.com/wp-content/uploads/2020/02/12-193x278.jpg' &&
              manga.chapter === '22 END' &&
              manga.url === 'https://www.mangadods.com/manga/flower-war/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchAsuraScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('tougen anki', SiteType.AsuraScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.AsuraScans &&
              manga.title === 'Tougen Anki' &&
              manga.image === 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg?h=80' &&
              manga.chapter === '19' &&
              manga.url === 'https://asurascans.com/manga/tougen-anki/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchManhwaClub (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('settia', SiteType.ManhwaClub).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.ManhwaClub &&
              manga.title === 'Settia' &&
              manga.image === 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg' &&
              manga.chapter === 'Chapter 25' &&
              manga.url === 'https://manhwa.club/manhwa/settia/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMangaTx (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('grandest wedding', SiteType.MangaTx).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MangaTx &&
              manga.title === 'Grandest Wedding' &&
              manga.image === 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png' &&
              manga.chapter === 'Chapter 169 [End]' &&
              manga.url === 'https://mangatx.com/manga/grandest-wedding/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMangago (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('kimetsu no yaiba tomioka giyuu gaiden', SiteType.Mangago).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.Mangago &&
              manga.title === 'Kimetsu no Yaiba: Tomioka Giyuu Gaiden' &&
              manga.image === 'http://i4.mangapicgallery.com/r/coverlink/rROHYYKHa8HiliDzWniyeapxzJzU4oSoQvrAEzs86qJ0-9a9KsW_WCWDR6JmMILwX7iiPFrhc1qQVGKUHxoNO0X_TxZml7V2h2XjXDYSPEeBcveUNZKJki_m9uxZhO_YTR6I5lBX9PK.jpg?4' &&
              manga.chapter === 'Ch.2' &&
              manga.url === 'http://www.mangago.me/read-manga/kimetsu_no_yaiba_tomioka_giyuu_gaiden/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}
