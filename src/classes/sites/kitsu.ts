import { ComponentRenderProxy } from '@vue/composition-api'
import { LocalStorage } from 'quasar'
import qs from 'qs'
import axios from 'axios'
import { Manga } from '../manga'
import { BaseSite } from './baseSite'
import { NotifyOptions } from '../notifyOptions'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import LoginDialog from 'src/components/LoginDialog.vue'
import constants from 'src/boot/constants'

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
        parent: componentRenderProxy
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

  getMangaId (url: string): number {
    const matches = /\/library-entries\/(\d*)/gm.exec(url) || []
    let mangaId = -1

    for (const match of matches) {
      const parsedMatch = parseInt(match)
      if (!isNaN(parsedMatch)) mangaId = parsedMatch
    }

    return mangaId
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return this.addToQueue(async () => {
      if (chapterNum === 0) {
        return
      }

      const response = await axios.patch(`${this.getUrl()}/api/edge/library-entries/${mangaId}`, {
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

      console.log(response.data)
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

      const usersResponse = response.data as UsersResponse
      if (usersResponse.data.length === 0) return Error('Response did not contain ID')

      return usersResponse.data[0].id
    })
  }
}

interface LoginResponse {
  'access_token': string
}

interface UsersResponse {
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
      titles: Record<string, string>,
      posterImage: {
        small: string
      }
    }
  }[]
}
