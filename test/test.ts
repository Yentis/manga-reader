import 'mocha'
import 'jsdom-global'
import { getMangaInfo, searchManga } from '../src/services/siteService'
import { SiteType } from '../src/enums/siteEnum'

const DEV = false

if (DEV) {
  describe('Dev', () => {
    it(SiteType.Webtoons, () => {
      return testSearchWebtoons()
    })
  })
} else {
  describe('Read url', () => {
    beforeEach(function () {
      this.timeout(5000)
    })

    it(SiteType.Manganelo, () => {
      return testManganelo()
    })

    it(SiteType.KKJScans, () => {
      return testKKJScans()
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
  })

  describe('Search query', () => {
    beforeEach(function () {
      this.timeout(5000)
    })

    it(SiteType.Manganelo, () => {
      return testSearchManganelo()
    })

    it(SiteType.KKJScans, () => {
      return testSearchKKJScans()
    })

    it(SiteType.Webtoons, () => {
      return testSearchWebtoons()
    })

    it(SiteType.HatigarmScans, () => {
      return testSearchHatigarmScans()
    })

    it(SiteType.Mangakakalot, () => {
      return testSearchMangakakalot()
    })

    // Doesn't work, need session token
    /* it(SiteType.MangaDex, () => {
      return testSearchMangaDex()
    }) */

    it(SiteType.FirstKissManga, () => {
      return testSearchFirstKissManga()
    })

    it(SiteType.MangaKomi, () => {
      return testSearchMangaKomi()
    })
  })
}

function testManganelo (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://manganelo.com/manga/ia919396', SiteType.Manganelo).then(mangaInfo => {
      if (mangaInfo.url !== 'https://manganelo.com/manga/ia919396') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Manganelo) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 84: Amor Fati 4') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://avt.mkklcdnv6.com/30/p/18-1583498266.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'The Eyes Of Sora') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://manganelo.com/chapter/ia919396/chapter_84') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testKKJScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://kkjscans.co/comics/797735-saurus', SiteType.KKJScans).then(mangaInfo => {
      if (mangaInfo.url !== 'https://kkjscans.co/comics/797735-saurus') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.KKJScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 14') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://kkjscans.co/storage/comics/B7AD2700758EE59D14ACDD75FDDE17D89207950A708C11A6/glM9WH3FZjnxtyx7BOBHOCDQckd6CI9MFz5PH1Jm.png') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Saurus') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://kkjscans.co/comics/797735-saurus/1/14') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testWebtoons (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142', SiteType.Webtoons).then(mangaInfo => {
      if (mangaInfo.url !== 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Webtoons) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Episode 16') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'The Wolf & Red Riding Hood') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testWebtoonsMobile (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://m.webtoons.com/en/super-hero/xinker/list?title_no=541', SiteType.Webtoons).then(mangaInfo => {
      if (mangaInfo.url !== 'https://m.webtoons.com/en/super-hero/xinker/list?title_no=541') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Webtoons) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Epilogue') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://swebtoon-phinf.pstatic.net/20150914_105/1442197929184ASdSX_JPEG/_EB9AA1EB80AB_E293A4EABCB9__EB84BD_EB90A3EB80AB_EC86BDE.jpg?type=crop540_540') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'XINK3R') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://m.webtoons.com/en/super-hero/xinker/epilogue/viewer?title_no=541&episode_no=223') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testHatigarmScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai', SiteType.HatigarmScans).then(mangaInfo => {
      if (mangaInfo.url !== 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.HatigarmScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 5') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Ichizu de Bitch na Kouhai') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testFirstkissmanga (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://1stkissmanga.com/manga/ripples-of-love/', SiteType.FirstKissManga).then(mangaInfo => {
      if (mangaInfo.url !== 'https://1stkissmanga.com/manga/ripples-of-love/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.FirstKissManga) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 99') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://1stkissmanga.com/wp-content/uploads/2019/12/Hades-Delivery-Shop.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Ripples Of Love') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://1stkissmanga.com/manga/ripples-of-love/chapter-99/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangakakalot (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangakakalot.com/manga/ui921789', SiteType.Mangakakalot).then(mangaInfo => {
      if (mangaInfo.url !== 'https://mangakakalot.com/manga/ui921789') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Mangakakalot) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Vol.3 Chapter 19: The Great Tehonbiki Gamble, Part 6') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://avt.mkklcdnv6.com/19/k/20-1583501770.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Legend of the End-of-Century Gambling Wolf Saga') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://mangakakalot.com/chapter/ui921789/chapter_19') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangadex (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangadex.org/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored', SiteType.MangaDex).then(mangaInfo => {
      if (mangaInfo.url !== 'https://mangadex.org/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MangaDex) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Vol. 24 Ch. 95 - World of Stars and Stripes - Outro') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://mangadex.org/images/manga/6272.jpg?1531150797') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://mangadex.org/chapter/24552') reject(Error('Chapter URL did not match, was: ' + mangaInfo.chapterUrl))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangakomi (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangakomi.com/manga/good-night/', SiteType.MangaKomi).then(mangaInfo => {
      if (mangaInfo.url !== 'https://mangakomi.com/manga/good-night/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MangaKomi) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 34 - The End') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432-193x278.png') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Good Night') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://mangakomi.com/manga/good-night/chapter-34/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else resolve()
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
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchKKJScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('saurus', SiteType.KKJScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.KKJScans &&
              manga.title === 'Saurus' &&
              manga.image === 'https://kkjscans.co/storage/comics/B7AD2700758EE59D14ACDD75FDDE17D89207950A708C11A6/glM9WH3FZjnxtyx7BOBHOCDQckd6CI9MFz5PH1Jm.png' &&
              manga.chapter === 'Chapter 14' &&
              manga.url === 'https://kkjscans.co/comics/797735-saurus'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
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
      else resolve()
    }).catch(error => reject(error))
  })
} */

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
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchMangaKomi (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('nanatsu no taizai', SiteType.MangaKomi).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.MangaKomi &&
              manga.title === 'Nanatsu no Taizai' &&
              manga.image === 'https://mangakomi.com/wp-content/uploads/2020/03/thumb_5e5c4904a9158-193x278.jpg' &&
              manga.chapter === 'Chapter 346.6 - The rain forest invites the beginning - Omake' &&
              manga.url === 'https://mangakomi.com/manga/nanatsu-no-taizai/'
      })

      if (matchingManga.length === 0) reject(Error('No matching result'))
      else resolve()
    }).catch(error => reject(error))
  })
}
