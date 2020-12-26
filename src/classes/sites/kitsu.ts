import { ComponentRenderProxy } from '@vue/composition-api'
import { LocalStorage } from 'quasar'
import qs from 'qs'
import axios from 'axios'
import { Manga } from '../manga'
import { BaseSite } from './baseSite'
import { NotifyOptions } from '../notifyOptions'
import { LinkingSiteType } from '../../enums/linkingSiteEnum'
import LoginDialog from '../../components/LoginDialog.vue'
import constants from '../../boot/constants'
import { SiteName } from '../../enums/siteEnum'

const SITE_TYPE = LinkingSiteType.Kitsu

export class Kitsu extends BaseSite {
  siteType = SITE_TYPE
  token: string = LocalStorage.getItem(constants().KITSU_TOKEN) || ''

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

  openLogin (componentRenderProxy: ComponentRenderProxy): Promise<Error | boolean> {
    return new Promise((resolve) => {
      componentRenderProxy.$q.dialog({
        component: LoginDialog,
        parent: componentRenderProxy,
        siteName: SiteName[this.siteType]
      }).onOk((data: { username: string, password: string }) => {
        componentRenderProxy.$q.loading.show({
          delay: 100
        })

        this.addToQueue(async () => {
          const response = await axios.post(`${this.getUrl()}/api/oauth/token`, {
            grant_type: 'password',
            username: data.username,
            password: data.password
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          })

          return response.data as LoginResponse
        }).then((response) => {
          if (response instanceof Error) {
            componentRenderProxy.$store.commit('reader/pushNotification', new NotifyOptions(response))
            return
          }

          this.token = response.access_token
          LocalStorage.set(componentRenderProxy.$constants.KITSU_TOKEN, this.token)
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
          componentRenderProxy.$q.loading.hide()
        })
      }).onCancel(() => {
        resolve(false)
      })
    })
  }

  async getMangaId (componentRenderProxy: ComponentRenderProxy, url: string): Promise<number | Error> {
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

    componentRenderProxy.$q.loading.show({
      delay: 100
    })

    // Try to get the manga ID
    const match = mangaMatches[1]
    const mangaId = await this.searchMangaSlug(match)
    if (mangaId instanceof Error) {
      componentRenderProxy.$q.loading.hide()
      return mangaId
    }

    // Try to get the user ID
    let userId = await this.getUserId()
    if (userId instanceof Error) {
      componentRenderProxy.$q.loading.hide()

      // Ask to log in if we're not already
      const loggedIn = await this.openLogin(componentRenderProxy)
      if (loggedIn instanceof Error) return loggedIn
      if (loggedIn === false) return userId

      componentRenderProxy.$q.loading.show({
        delay: 100
      })

      userId = await this.getUserId()
      if (userId instanceof Error) {
        componentRenderProxy.$q.loading.hide()
        return userId
      }
    }

    // Finally get the library ID
    const libraryId = await this.getLibraryId(mangaId, userId)
    componentRenderProxy.$q.loading.hide()
    if (libraryId instanceof Error) return libraryId

    return parseInt(libraryId)
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return this.addToQueue(async () => {
      if (chapterNum === 0) {
        return
      }

      await axios.patch(`${this.getUrl()}/api/edge/library-entries/${mangaId}`, {
        data: {
          attributes: {
            progress: chapterNum
          },
          id: mangaId.toString(),
          type: 'library-entries'
        }
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/vnd.api+json'
        }
      })
    })
  }

  getTestUrl (): string {
    return ''
  }

  readUrl (url: string): Promise<Error | Manga> {
    return Promise.resolve(Error(`Could not read ${url}, not implemented.`))
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
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

      const response = await axios.get(`${this.getUrl()}/api/edge/library-entries?${queryString}`)
      const libraryEntriesResponse = response.data as LibraryEntriesResponse
      const mangaList: Manga[] = []

      if (!libraryEntriesResponse.included) return mangaList

      libraryEntriesResponse.included.forEach(entry => {
        const library = libraryEntriesResponse.data.find(library => {
          return library.relationships.manga.data.id === entry.id
        })
        const title = Object.values(entry.attributes.titles).find(title => this.titleContainsQuery(query, title))

        if (library && title) {
          const manga = new Manga(library.links.self, LinkingSiteType.Kitsu)
          const progress = library?.attributes.progress || 'unknown'

          manga.title = title
          manga.chapter = `Chapter ${progress}`
          manga.image = entry.attributes.posterImage.small
          mangaList.push(manga)
        }
      })

      return mangaList
    })
  }

  private getUserId (): Promise<Error | string> {
    return this.addToQueue(async () => {
      const queryString = qs.stringify({
        'filter[self]': true,
        'fields[users]': 'id'
      })

      const response = await axios.get(`${this.getUrl()}/api/edge/users?${queryString}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })

      const usersResponse = response.data as BasicResponse
      if (usersResponse.data.length === 0) return Error('Response did not contain ID')

      return usersResponse.data[0].id
    })
  }

  private searchMangaSlug (url: string): Promise<Error | string> {
    return this.addToQueue(async () => {
      const queryString = qs.stringify({
        'fields[manga]': 'id',
        'filter[slug]': url
      })

      const response = await axios.get(`${this.getUrl()}/api/edge/manga?${queryString}`)
      const mangaResponse = response.data as BasicResponse

      if (mangaResponse.data.length === 0) return Error('Response did not contain ID')
      return mangaResponse.data[0].id
    })
  }

  private getLibraryId (mangaId: string, userId: string): Promise<Error | string> {
    return this.addToQueue(async () => {
      const queryString = qs.stringify({
        'filter[manga_id]': mangaId,
        'filter[user_id]': userId
      })

      const response = await axios.get(`${this.getUrl()}/api/edge/library-entries?${queryString}`)
      const libraryResponse = response.data as BasicResponse

      if (libraryResponse.data.length === 0) return Error('Response did not contain ID')
      return libraryResponse.data[0].id
    })
  }
}

interface LoginResponse {
  'access_token': string
}

interface BasicResponse {
  data: { id: string }[]
}

interface LibraryEntriesResponse {
  data: {
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
  }[]
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
