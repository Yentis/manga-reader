import { LocalStorage } from 'quasar'
import { QVueGlobals } from 'quasar/dist/types'
import { BaseSite } from './baseSite'
import { NotifyOptions } from '../notifyOptions'
import LoginDialog from '../../components/LoginDialog.vue'
import { Manga } from '../manga'
import { Store } from 'vuex'
import constants from 'src/classes/constants'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { ContentType } from 'src/enums/contentTypeEnum'
import { requestHandler } from 'src/services/requestService'
import qs from 'qs'
import { getSiteNameByUrl, titleContainsQuery } from 'src/utils/siteUtils'

interface LoginResponse {
  'access_token': string
}

interface BasicResponse {
  data: { id: string }[]
}

interface Data {
  id: string,
  links: {
    self: string
  },
  attributes: {
    progress: number
  },
  relationships: {
    manga: {
      data: {
        id: string
      }
    }
  }
}

interface LibraryEntriesResponse {
  data: Data[]
  included: {
    id: string,
    links: {
      self: string
    },
    attributes: {
      titles: Record<string, string | undefined>,
      posterImage: {
        small: string
      }
    }
  }[] | undefined
}

export class Kitsu extends BaseSite {
  siteType = LinkingSiteType.Kitsu
  token: string = LocalStorage.getItem(constants.KITSU_TOKEN) || ''

  constructor () {
    super()
    this.checkLogin().then(loggedIn => {
      this.loggedIn = loggedIn
    }).catch(error => {
      console.error(error)
      this.loggedIn = false
    })
  }

  checkLogin (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getUserId().then(id => {
        resolve(typeof id === 'string')
      }).catch(error => {
        reject(error)
      })
    })
  }

  openLogin ($q: QVueGlobals, store: Store<unknown>): Promise<Error | boolean> {
    return new Promise((resolve) => {
      const siteName = getSiteNameByUrl(this.siteType)
      if (siteName === undefined) {
        resolve(Error('Valid site not found'))
        return
      }

      $q.dialog({
        component: LoginDialog,
        componentProps: {
          siteName
        }
      }).onOk((data: { username: string, password: string }) => {
        $q.loading.show({
          delay: 100
        })

        this.doLogin(data).then((response) => {
          if (response instanceof Error) {
            store.commit('reader/pushNotification', new NotifyOptions(response))
            return
          }

          this.checkLogin().then(loggedIn => {
            this.loggedIn = loggedIn
            resolve(loggedIn)
          }).catch(error => {
            this.loggedIn = false
            resolve(error)
          })
        }).catch((error) => {
          resolve(error)
        }).finally(() => {
          $q.loading.hide()
        })
      }).onCancel(() => {
        resolve(false)
      })
    })
  }

  async getMangaId ($q: QVueGlobals, store: Store<unknown>, url: string): Promise<number | Error> {
    // First try a regular library entry URL
    const libraryMatches = /\/library-entries\/(\d*)/gm.exec(url) || []
    let result = -1

    for (const match of libraryMatches) {
      const parsedMatch = parseInt(match)
      if (!isNaN(parsedMatch)) result = parsedMatch
    }
    if (result !== -1) return result

    // Next try a manga URL
    const mangaMatches = /\/manga\/([\w-]*)/gm.exec(url) || []
    if (mangaMatches.length !== 2) return result

    $q.loading.show({
      delay: 100
    })

    // Try to get the manga ID
    const match = mangaMatches[1]
    const mangaId = await this.searchMangaSlug(match)
    if (mangaId instanceof Error) {
      $q.loading.hide()
      return mangaId
    }

    // Try to get the user ID
    let userId = await this.getUserId()
    if (userId instanceof Error) {
      $q.loading.hide()

      // Ask to log in if we're not already
      const loggedIn = await this.openLogin($q, store)
      if (loggedIn instanceof Error) return loggedIn
      if (loggedIn === false) return userId

      $q.loading.show({
        delay: 100
      })

      userId = await this.getUserId()
      if (userId instanceof Error) {
        $q.loading.hide()
        return userId
      }
    }

    // Finally get the library ID
    const libraryId = await this.getLibraryId(mangaId, userId)
    $q.loading.hide()
    if (libraryId instanceof Error) return libraryId

    return parseInt(libraryId)
  }

  getTestUrl (): string {
    return ''
  }

  async doLogin (data: { username: string, password: string }): Promise<Error | LoginResponse> {
    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/api/oauth/token`,
      data: `{"grant_type": "password", "username": "${data.username}", "password": "${data.password}"}`,
      headers: { 'Content-Type': ContentType.JSON }
    }
    const response = await requestHandler.sendRequest(request)
    const loginResponse = JSON.parse(response.data) as LoginResponse

    this.token = loginResponse.access_token
    LocalStorage.set(constants.KITSU_TOKEN, this.token)

    return loginResponse
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return this.addToQueue(() => this.syncReadChapterImpl(mangaId, chapterNum))
  }

  private async syncReadChapterImpl (mangaId: number, chapterNum: number): Promise<void | Error> {
    if (chapterNum === 0) {
      return
    }

    const request: HttpRequest = {
      method: 'PATCH',
      url: `${this.getUrl()}/api/edge/library-entries/${mangaId}`,
      data: `{
        "data": {
          "attributes": {
            "progress": ${chapterNum}
          },
          "id": "${mangaId.toString()}",
          "type": "library-entries"
        }
      }`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': ContentType.VND_API_JSON
      }
    }
    await requestHandler.sendRequest(request)
  }

  readUrlImpl (url: string): Promise<Error | Manga> {
    return Promise.resolve(Error(`Could not read ${url}, not implemented.`))
  }

  async searchImpl (query: string): Promise<Error | Manga[]> {
    const id = await this.getUserId()
    if (id instanceof Error) {
      return id
    }

    const queryString = qs.stringify({
      'filter[user_id]': id,
      'filter[title]': query,
      'filter[kind]': 'manga',
      include: 'manga',
      'fields[libraryEntries]': 'id,manga,progress',
      'fields[manga]': 'titles,posterImage'
    })

    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/api/edge/library-entries?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const libraryEntriesResponse = JSON.parse(response.data) as LibraryEntriesResponse
    const mangaList: Manga[] = []

    if (!libraryEntriesResponse.included) return mangaList

    libraryEntriesResponse.included.forEach((entry) => {
      const library = libraryEntriesResponse.data.find((library) => {
        return library.relationships.manga.data.id === entry.id
      })
      const title = Object.values(entry.attributes.titles).find((title) => titleContainsQuery(query, title))

      if (library && title) {
        const manga = new Manga(library.links.self, this.siteType)
        const progress = library?.attributes.progress || 'unknown'

        manga.title = title
        manga.chapter = `Chapter ${progress}`
        manga.image = entry.attributes.posterImage.small
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  getUserId (): Promise<Error | string> {
    return this.addToQueue(() => this.getUserIdImpl())
  }

  private async getUserIdImpl (): Promise<Error | string> {
    const queryString = qs.stringify({
      'filter[self]': true,
      'fields[users]': 'id'
    })

    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/api/edge/users?${queryString}`,
      headers: { Authorization: `Bearer ${this.token}` }
    }
    const response = await requestHandler.sendRequest(request)

    const usersResponse = JSON.parse(response.data) as BasicResponse
    const firstData = usersResponse.data[0]
    if (!firstData) return Error('Response did not contain ID')

    return firstData.id
  }

  private searchMangaSlug (url: string | undefined): Promise<Error | string> {
    if (!url) return Promise.resolve(Error('No manga slug URL found'))
    return this.addToQueue(() => this.searchMangaSlugImpl(url))
  }

  private async searchMangaSlugImpl (url: string): Promise<Error | string> {
    const queryString = qs.stringify({
      'fields[manga]': 'id',
      'filter[slug]': url
    })

    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/api/edge/manga?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const mangaResponse = JSON.parse(response.data) as BasicResponse

    const firstData = mangaResponse.data[0]
    if (!firstData) return Error('Response did not contain ID')
    return firstData.id
  }

  getLibraryInfo (mangaId: string, userId: string): Promise<Error | Data> {
    return this.addToQueue(() => this.getLibraryInfoImpl(mangaId, userId))
  }

  private async getLibraryInfoImpl (mangaId: string, userId: string): Promise<Error | Data> {
    const queryString = qs.stringify({
      'filter[manga_id]': mangaId,
      'filter[user_id]': userId
    })

    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/api/edge/library-entries?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const libraryResponse = JSON.parse(response.data) as LibraryEntriesResponse

    const firstData = libraryResponse.data[0]
    if (!firstData) return Error('Response did not contain info')
    return firstData
  }

  private async getLibraryId (mangaId: string, userId: string): Promise<Error | string> {
    const libraryInfo = await this.getLibraryInfo(mangaId, userId)
    if (libraryInfo instanceof Error) return libraryInfo

    return libraryInfo.id
  }
}
