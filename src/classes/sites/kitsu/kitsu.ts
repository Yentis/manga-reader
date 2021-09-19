import { LocalStorage } from 'quasar'
import { QVueGlobals } from 'quasar/dist/types'
import { BaseSite } from '../baseSite'
import { NotifyOptions } from '../../notifyOptions'
import LoginDialog from '../../../components/LoginDialog.vue'
import { KitsuRequestType, SiteRequestType } from '../../../enums/workerEnum'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import Worker from 'worker-loader!src/workers/kitsu.worker'
import { Manga } from '../../manga'
import { Data, KitsuWorker, LoginResponse } from './kitsuWorker'
import { Store } from 'vuex'
import constants from 'src/classes/constants'
import { getSiteNameByUrl } from 'src/services/siteService'

export class Kitsu extends BaseSite {
  token: string = LocalStorage.getItem(constants.KITSU_TOKEN) || ''
  siteType = KitsuWorker.siteType
  WorkerClass = Worker

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
    return KitsuWorker.testUrl
  }

  async doLogin (loginInfo: { username: string, password: string }): Promise<Error | LoginResponse> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (event.data instanceof Error) {
            resolve(event.data)
          } else {
            const loginResponse = event.data as LoginResponse
            this.token = loginResponse.access_token
            LocalStorage.set(constants.KITSU_TOKEN, this.token)

            resolve(event.data as LoginResponse)
          }
        }
        const data = new Map()
        data.set('username', loginInfo.username)
        data.set('password', loginInfo.password)
        worker.postMessage(new SiteWorkerMessage(KitsuRequestType.LOGIN, data, this))
      })
    })
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (event.data instanceof Error) {
            resolve(event.data)
          } else {
            resolve()
          }
        }
        const data = new Map()
        data.set('mangaId', mangaId)
        data.set('chapterNum', chapterNum)
        data.set('token', this.token)
        worker.postMessage(new SiteWorkerMessage(SiteRequestType.SYNC_CHAPTER, data, this))
      })
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (event.data instanceof Error) {
            resolve(event.data)
          } else if (Array.isArray(event.data)) {
            resolve(event.data.map((item) => Manga.clone(item)))
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('query', query)
        data.set('token', this.token)
        worker.postMessage(new SiteWorkerMessage(SiteRequestType.SEARCH, data, this))
      })
    })
  }

  getUserId (): Promise<Error | string> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (typeof event.data === 'string' || event.data instanceof Error) {
            resolve(event.data)
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('token', this.token)
        worker.postMessage(new SiteWorkerMessage(KitsuRequestType.USER_ID, data, this))
      })
    })
  }

  private searchMangaSlug (url: string): Promise<Error | string> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (typeof event.data === 'string' || event.data instanceof Error) {
            resolve(event.data)
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('url', url)
        worker.postMessage(new SiteWorkerMessage(KitsuRequestType.MANGA_SLUG, data, this))
      })
    })
  }

  getLibraryInfo (mangaId: string, userId: string): Promise<Error | Data> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (typeof event.data === 'object' || event.data instanceof Error) {
            resolve(event.data as Data | Error)
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('mangaId', mangaId)
        data.set('userId', userId)
        worker.postMessage(new SiteWorkerMessage(KitsuRequestType.LIBRARY_INFO, data, this))
      })
    })
  }

  private async getLibraryId (mangaId: string, userId: string): Promise<Error | string> {
    const libraryInfo = await this.getLibraryInfo(mangaId, userId)
    if (libraryInfo instanceof Error) return libraryInfo

    return libraryInfo.id
  }
}
