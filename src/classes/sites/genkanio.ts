import { Manga } from 'src/classes/manga'
import { getCookies, HEADER_USER_AGENT, MOBILE_USER_AGENT } from 'src/classes/requests/baseRequest'
import { ContentType } from 'src/enums/contentTypeEnum'
import { Platform } from 'src/enums/platformEnum'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { getPlatform } from 'src/services/platformService'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface InitialData {
  fingerprint: {
    id: string,
    name: string,
    locale: string,
    path: string,
    method: string
  },
  serverMemo: {
    children: unknown[],
    errors: unknown[],
    htmlHash: string,
    data: {
      readyToLoad: boolean,
      search: string,
      sortDirection: string,
      page: number
    },
    dataMeta: unknown[],
    checksum: string
  }
}

interface LivewireResponse {
  effects: {
    html: string,
    dirty: string[]
  },
  serverMemo: {
    htmlHash: string,
    data: {
      readyToLoad: boolean
    },
    checksum: string
  }
}

class GenkanioData extends BaseData {
  chapterUrl?: Element
}

export class Genkanio extends BaseSite {
  siteType = SiteType.Genkan

  getChapter (data: BaseData): string {
    const url = super.getChapter(data)
    if (url === '-') return `Chapter ${this.getChapterNum(data)}`
    return url
  }

  getChapterUrl (data: GenkanioData): string {
    return data.chapterUrl?.getAttribute('href') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    this.trySetUserAgent(request)

    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const columns = doc.querySelectorAll('tbody tr')[0]?.children

    const data = new GenkanioData(url)
    data.chapter = columns?.item(1)
    data.chapterUrl = columns?.item(columns.length - 1)?.querySelectorAll('a')[0]
    data.chapterNum = columns?.item(0)
    data.image = doc.querySelectorAll('section img')[0]
    data.title = doc.querySelectorAll('h2')[0]
    data.chapterDate = columns?.item(5)

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/manga` }
    this.trySetUserAgent(request)

    const response = await requestHandler.sendRequest(request)
    const parser = new DOMParser()
    let doc = await parseHtmlFromString(response.data, parser)

    const wireElement = doc.querySelectorAll('div[wire\\:initial-data]')[0]
    const initialDataJSON = wireElement?.getAttribute('wire:initial-data')
    if (!initialDataJSON) return Error('Failed to read initial data')
    const initialData = JSON.parse(initialDataJSON) as InitialData

    const csrfTokenElement = doc.querySelectorAll('meta[name="csrf-token"]')[0]
    const xcsrfToken = csrfTokenElement?.getAttribute('content')
    if (!xcsrfToken) return Error('Failed to read x-csrf-token')

    const loadData = {
      fingerprint: initialData.fingerprint,
      serverMemo: initialData.serverMemo,
      updates: [{
        type: 'callMethod',
        payload: {
          method: 'loadManga',
          params: []
        }
      }]
    }

    const responseCookies = getCookies(response)
    const responseXsrfToken = responseCookies['XSRF-TOKEN'] || ''
    const responseGenkanSession = responseCookies.genkan_session || ''

    const loadRequest: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/livewire/message/manga.list-all-manga`,
      data: JSON.stringify(loadData),
      headers: {
        'X-CSRF-TOKEN': xcsrfToken,
        'X-Livewire': 'true',
        'Content-Type': ContentType.JSON,
        cookie: `XSRF-TOKEN=${responseXsrfToken};genkan_session=${responseGenkanSession}`
      }
    }
    this.trySetUserAgent(loadRequest)

    const loadResponse = await requestHandler.sendRequest(loadRequest)
    const loadLivewireResponse = JSON.parse(loadResponse.data) as LivewireResponse

    initialData.serverMemo.htmlHash = loadLivewireResponse.serverMemo.htmlHash
    initialData.serverMemo.data.readyToLoad = loadLivewireResponse.serverMemo.data.readyToLoad
    initialData.serverMemo.checksum = loadLivewireResponse.serverMemo.checksum

    const requestData = {
      fingerprint: initialData.fingerprint,
      serverMemo: initialData.serverMemo,
      updates: [{
        type: 'syncInput',
        payload: {
          name: 'search',
          value: query
        }
      }]
    }

    const loadResponseCookies = getCookies(loadResponse)
    const loadResponseXsrfToken = loadResponseCookies['XSRF-TOKEN'] || ''
    const loadResponseGenkanSession = loadResponseCookies.genkan_session || ''

    const searchRequest: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/livewire/message/manga.list-all-manga`,
      data: JSON.stringify(requestData),
      headers: {
        'X-CSRF-TOKEN': xcsrfToken,
        'X-Livewire': 'true',
        'Content-Type': ContentType.JSON,
        cookie: `XSRF-TOKEN=${loadResponseXsrfToken};genkan_session=${loadResponseGenkanSession}`
      }
    }
    this.trySetUserAgent(searchRequest)

    const searchResponse = await requestHandler.sendRequest(searchRequest)
    const searchLivewireResponse = JSON.parse(searchResponse.data) as LivewireResponse
    doc = await parseHtmlFromString(searchLivewireResponse.effects.html, parser)
    const promises: Promise<Error | Manga>[] = []

    doc.querySelectorAll('li[x-show="show"]').forEach((titleElem) => {
      const title = titleElem.textContent?.trim() || ''

      if (!titleContainsQuery(query, title)) return
      const url = titleElem.querySelectorAll('a')[0]?.getAttribute('href') || ''
      if (!url) return

      promises.push(this.readUrl(url))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  private trySetUserAgent (request: HttpRequest) {
    if (getPlatform() !== Platform.Cordova) return

    const headers = request.headers || {}
    headers[HEADER_USER_AGENT] = MOBILE_USER_AGENT
    request.headers = headers
  }

  getTestUrl (): string {
    return `${this.getUrl()}/manga/8383424626-castle`
  }
}
