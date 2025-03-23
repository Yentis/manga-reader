import moment from 'moment'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getDateFromNow, parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import constants from '../constants'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

export class Mangakakalot extends BaseSite {
  siteType = SiteType.Mangakakalot

  public override async readImage(url: string): Promise<string> {
    const request: HttpRequest = {
      method: 'GET',
      url,
      headers: {
        referer: `${this.getUrl()}/`,
        responseType: 'arraybuffer',
      },
    }

    const response = await requestHandler.sendRequest(request)
    return `data:image/png;base64,${response.data}`
  }

  getChapterNum (data: BaseData): number {
    const chapter = this.getChapter(data)
    const matches = /Chapter ([-+]?[0-9]*\.?[0-9]+)/gm.exec(chapter) || []
    let num = 0

    for (const match of matches) {
      const parsedMatch = parseFloat(match)
      if (!isNaN(parsedMatch)) num = parsedMatch
    }

    return num
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.getAttribute('title'), 'MMM-DD-YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return getDateFromNow(data.chapterDate?.getAttribute('title'))
    }
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const script = doc.querySelectorAll('script')[0]?.innerHTML.trim() || ''
    if (script.startsWith('window.location.assign')) {
      const target = script.replace('window.location.assign("', '').replace('");', '')
      return Error(`${constants.REDIRECT_PREFIX}${target}`)
    }

    const data = new BaseData(url)
    data.chapter = doc.querySelectorAll('.chapter-list a')[0]
    data.image = doc.querySelectorAll('.manga-info-pic img')[0]
    data.title = doc.querySelectorAll('.manga-info-text h1')[0]
    const spanElements = doc.querySelectorAll('.chapter-list .row')[0]?.querySelectorAll('span')
    data.chapterDate = spanElements?.item(spanElements.length - 1)

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/search/story/${this.changeAlias(query)}`,
      headers: {
        referer: `${this.getUrl()}/`
      },
    }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const searchItems = doc.querySelectorAll('.story_item')
    const mangaList = []

    for (const item of searchItems) {
      const url = item.querySelectorAll('a')[0]?.getAttribute('href')
      if (!url) continue

      const data = new BaseData(url)
      data.title = item.querySelectorAll('.story_name')[0]
      data.image = item.querySelectorAll('img')[0]
      data.chapter = item.querySelectorAll('.story_chapter')[0]

      const manga = this.buildManga(data)
      if (!titleContainsQuery(query, manga.title)) continue

      mangaList.push(manga)
    }

    return mangaList
  }

  // Taken directly from the site
  private changeAlias(alias: string) {
    let str = alias;
    str = str.toLowerCase();
    str = str.replace(/Ã |Ã¡|áº¡|áº£|Ã£|Ã¢|áº§|áº¥|áº­|áº©|áº«|Äƒ|áº±|áº¯|áº·|áº³|áºµ/g, "a");
    str = str.replace(/Ã¨|Ã©|áº¹|áº»|áº½|Ãª|á»|áº¿|á»‡|á»ƒ|á»…/g, "e");
    str = str.replace(/Ã¬|Ã­|á»‹|á»‰|Ä©/g, "i");
    str = str.replace(/Ã²|Ã³|á»|á»|Ãµ|Ã´|á»“|á»‘|á»™|á»•|á»—|Æ¡|á»|á»›|á»£|á»Ÿ|á»¡/g, "o");
    str = str.replace(/Ã¹|Ãº|á»¥|á»§|Å©|Æ°|á»«|á»©|á»±|á»­|á»¯/g, "u");
    str = str.replace(/á»³|Ã½|á»µ|á»·|á»¹/g, "y");
    str = str.replace(/Ä‘/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|-|$|_/g, "_");
    str = str.replace(/_+_/g, "_");
    str = str.replace(/^\_+|\_+$/g, "");
    return str;
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return 'https://user.manganelo.com/login?l=mangakakalot'
  }

  getTestUrl (): string {
    return `${this.getUrl()}/manga/osananajimi-ni-najimitai`
  }
}
