import 'mocha'
import 'jsdom-global'
import { getMangaInfo, searchManga } from '../src/services/siteService'
import { SiteType } from '../src/enums/siteEnum'

const DEV = false

if (DEV) {
  describe('Dev', function () {
    this.timeout(10000)

    it(SiteType.AsuraScans, () => {
      return testAsuraScans()
    })

    it(SiteType.AsuraScans, () => {
      return testSearchAsuraScans()
    })
  })
} else {
  describe('Read url', function () {
    this.timeout(10000)

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
  })

  describe('Search query', function () {
    this.timeout(10000)

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
  })
}

function testManganelo (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://manganelo.com/manga/pu918807', SiteType.Manganelo).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://manganelo.com/manga/pu918807') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Manganelo) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Vol.6 Chapter 57: The Final Chapter') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://avt.mkklcdnv6.com/8/x/18-1583497426.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Kudan No Gotoshi') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://manganelo.com/chapter/pu918807/chapter_57') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testKKJScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://kkjscans.co/comics/688015-the-rebirth-of-an-8th-circled-wizard', SiteType.KKJScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://kkjscans.co/comics/688015-the-rebirth-of-an-8th-circled-wizard') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.KKJScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Season 1 Finale') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://kkjscans.co/storage/comics/AA1DB1EFF76AD034EED5034A101770A052FE4B16332B3A14/sG9SfErajIj3wg1Dhbu0f3rFcZYrXSVqBLjRgFAA.jpeg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'The Rebirth of an 8th Circled Wizard') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://kkjscans.co/comics/688015-the-rebirth-of-an-8th-circled-wizard/1/36') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testWebtoons (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142', SiteType.Webtoons).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Webtoons) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Episode 16') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://swebtoon-phinf.pstatic.net/20200723_56/15954724513992Eqto_JPEG/04_EC9E91ED9288EC8381EC84B8_mobile.jpg?type=crop540_540') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'The Wolf & Red Riding Hood') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/episode-16/viewer?title_no=2142&episode_no=16') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testWebtoonsMobile (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://m.webtoons.com/en/super-hero/xinker/list?title_no=541', SiteType.Webtoons).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://m.webtoons.com/en/super-hero/xinker/list?title_no=541') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Webtoons) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Epilogue') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://swebtoon-phinf.pstatic.net/20150914_105/1442197929184ASdSX_JPEG/_EB9AA1EB80AB_E293A4EABCB9__EB84BD_EB90A3EB80AB_EC86BDE.jpg?type=crop540_540') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'XINK3R') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://m.webtoons.com/en/super-hero/xinker/epilogue/viewer?title_no=541&episode_no=223') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testHatigarmScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai', SiteType.HatigarmScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.HatigarmScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 5') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://hatigarmscanz.net/storage/comics/0136EED9F0042F701F86C0B47B925F5255FC39FB87F336DB/bhK9esSCI5sZgJOO9dw5gcLNfwne47H69XOxQHs1.jpeg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Ichizu de Bitch na Kouhai') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai/1/5') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testFirstkissmanga (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://1stkissmanga.com/manga/royal-shop-of-young-lady/', SiteType.FirstKissManga).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://1stkissmanga.com/manga/royal-shop-of-young-lady/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.FirstKissManga) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 16') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://1stkissmanga.com/wp-content/uploads/2020/08/royal-shop-of-young-lady-193x278.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Royal Shop of Young Lady') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://1stkissmanga.com/manga/royal-shop-of-young-lady/chapter-16/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangakakalot (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangakakalot.com/manga/ui921789', SiteType.Mangakakalot).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://mangakakalot.com/manga/ui921789') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.Mangakakalot) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Vol.3 Chapter 20: The Great Tehonbiki Gamble, Part 7') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://avt.mkklcdnv6.com/19/k/20-1583501770.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Legend of the End-of-Century Gambling Wolf Saga') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://mangakakalot.com/chapter/ui921789/chapter_20') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangadex (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangadex.org/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored', SiteType.MangaDex).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://mangadex.org/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MangaDex) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Vol. 24 Ch. 95 - World of Stars and Stripes - Outro') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://mangadex.org/images/manga/6272.jpg?1531150797') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://mangadex.org/chapter/24552') reject(Error('Chapter URL did not match, was: ' + mangaInfo.chapterUrl))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangakomi (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://mangakomi.com/manga/good-night/', SiteType.MangaKomi).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://mangakomi.com/manga/good-night/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MangaKomi) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 34 - The End') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432.png') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Good Night') reject(Error(`Title ${mangaInfo.title} did not match`))
      else if (mangaInfo.chapterUrl !== 'https://mangakomi.com/manga/good-night/chapter-34/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMethodScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://methodscans.com/comics/773532-meng-shi-zai-shang', SiteType.MethodScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://methodscans.com/comics/773532-meng-shi-zai-shang') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MethodScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Yuan Yuan is as sharp as ever') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Meng Shi Zai Shang') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://methodscans.com/comics/773532-meng-shi-zai-shang/1/172') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testLeviatanScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://leviatanscans.com/comics/909261-stresser', SiteType.LeviatanScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://leviatanscans.com/comics/909261-stresser') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.LeviatanScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 8') reject(Error('Chapter did not match'))
      else if (mangaInfo.image !== 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Stresser') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://leviatanscans.com/comics/909261-stresser/1/8') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testHiperDEX (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://hiperdex.com/manga/arata-primal-the-new-primitive/', SiteType.HiperDEX).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://hiperdex.com/manga/arata-primal-the-new-primitive/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.HiperDEX) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== '35 [END]') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://hiperdex.com/wp-content/uploads/2020/04/Arata-Primal-193x278.jpg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'Arata Primal') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://hiperdex.com/manga/arata-primal-the-new-primitive/35-end/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testReaperScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://reaperscans.com/comics/621295-alpha', SiteType.ReaperScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://reaperscans.com/comics/621295-alpha') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.ReaperScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'End') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg') reject(Error('Image did not match'))
      else if (mangaInfo.title !== 'ALPHA') reject(Error('Title did not match'))
      else if (mangaInfo.chapterUrl !== 'https://reaperscans.com/comics/621295-alpha/1/20') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testMangaDoDs (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://www.mangadods.com/manga/flower-war/', SiteType.MangaDoDs).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://www.mangadods.com/manga/flower-war/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.MangaDoDs) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== '22 END') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://www.mangadods.com/wp-content/uploads/2020/02/12-193x278.jpg') reject(Error(`Image ${mangaInfo.image} did not match`))
      else if (mangaInfo.title !== 'Flower War') reject(Error(`Title ${mangaInfo.title} did not match`))
      else if (mangaInfo.chapterUrl !== 'https://www.mangadods.com/manga/flower-war/22-end/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testAsuraScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://asurascans.com/manga/tougen-anki/', SiteType.AsuraScans).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://asurascans.com/manga/tougen-anki/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.AsuraScans) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 19') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://asurascans.com/wp-content/uploads/2020/09/49754.jpg') reject(Error(`Image ${mangaInfo.image} did not match`))
      else if (mangaInfo.title !== 'Tougen Anki') reject(Error(`Title ${mangaInfo.title} did not match`))
      else if (mangaInfo.chapterUrl !== 'https://asurascans.com/tougen-anki-chapter-19/') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
      else resolve()
    }).catch((error) => reject(error))
  })
}

function testManhwaClub (): Promise<void> {
  return new Promise((resolve, reject) => {
    getMangaInfo('https://manhwa.club/manhwa/settia/', SiteType.ManhwaClub).then(mangaInfo => {
      if (mangaInfo instanceof Error) return reject(mangaInfo)

      if (mangaInfo.url !== 'https://manhwa.club/manhwa/settia/') reject(Error('URL did not match'))
      else if (mangaInfo.site !== SiteType.ManhwaClub) reject(Error('Site did not match'))
      else if (mangaInfo.chapter !== 'Chapter 25') reject(Error(`Chapter ${mangaInfo.chapter} did not match`))
      else if (mangaInfo.image !== 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg') reject(Error(`Image ${mangaInfo.image} did not match`))
      else if (mangaInfo.title !== 'Settia') reject(Error(`Title ${mangaInfo.title} did not match`))
      else if (mangaInfo.chapterUrl !== 'https://manhwa.club/manhwa/settia/chapter-25') reject(Error('Chapter URL did not match'))
      else if (mangaInfo.read !== undefined) reject(Error('Read did not match'))
      else if (mangaInfo.readUrl !== undefined) reject(Error('Read URL did not match'))
      else if (!mangaInfo.chapterDate.includes('ago')) reject(Error('Chapter date not valid'))
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
      else if (matchingManga.length > 1) reject(Error('Too many results'))
      else resolve()
    }).catch(error => reject(error))
  })
}

function testSearchKKJScans (): Promise<void> {
  return new Promise((resolve, reject) => {
    searchManga('the rebirth of an 8th circled wizard', SiteType.KKJScans).then(result => {
      const matchingManga = result.filter(manga => {
        return manga.site === SiteType.KKJScans &&
              manga.title === 'The Rebirth of an 8th Circled Wizard' &&
              manga.image === 'https://kkjscans.co/storage/comics/AA1DB1EFF76AD034EED5034A101770A052FE4B16332B3A14/sG9SfErajIj3wg1Dhbu0f3rFcZYrXSVqBLjRgFAA.jpeg' &&
              manga.chapter === 'Season 1 Finale' &&
              manga.url === 'https://kkjscans.co/comics/688015-the-rebirth-of-an-8th-circled-wizard'
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
              manga.image === 'https://asurascans.com/wp-content/uploads/2020/09/49754.jpg' &&
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
