import { ComponentRenderProxy } from '@vue/composition-api'
import { LocalStorage } from 'quasar'
import { BaseSite } from '../baseSite'
import { NotifyOptions } from '../../notifyOptions'
import LoginDialog from '../../../components/LoginDialog.vue'
import constants from '../../../boot/constants'
import { SiteName } from '../../../enums/siteEnum'
import { KitsuRequestType, RequestType } from '../../../enums/workerEnum'
import { WorkerRequest } from '../../workerRequest'
import Worker from 'worker-loader!src/workers/kitsu.worker'
import { Manga } from '../../manga'
import { KitsuWorker, LoginResponse } from './kitsuWorker'

export class Kitsu extends BaseSite {
  token: string = LocalStorage.getItem(constants().KITSU_TOKEN) || ''
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

        this.doLogin(data).then((response) => {
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

  getTestUrl (): string {
    return KitsuWorker.testUrl
  }

  async doLogin (loginInfo: { username: string, password: string }): Promise<Error | LoginResponse> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('username', loginInfo.username)
        data.set('password', loginInfo.password)
        worker.postMessage(new WorkerRequest(KitsuRequestType.LOGIN, data, this))
      })
    })
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('mangaId', mangaId)
        data.set('chapterNum', chapterNum)
        data.set('token', this.token)
        worker.postMessage(new WorkerRequest(RequestType.SYNC_CHAPTER, data, this))
      })
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('query', query)
        data.set('token', this.token)
        worker.postMessage(new WorkerRequest(RequestType.SEARCH, data, this))
      })
    })
  }

  private getUserId (): Promise<Error | string> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('token', this.token)
        worker.postMessage(new WorkerRequest(KitsuRequestType.USER_ID, data, this))
      })
    })
  }

  private searchMangaSlug (url: string): Promise<Error | string> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('url', url)
        worker.postMessage(new WorkerRequest(KitsuRequestType.MANGA_SLUG, data, this))
      })
    })
  }

  private getLibraryId (mangaId: string, userId: string): Promise<Error | string> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          resolve(event.data)
        }
        const data = new Map()
        data.set('mangaId', mangaId)
        data.set('userId', userId)
        worker.postMessage(new WorkerRequest(KitsuRequestType.LIBRARY_ID, data, this))
      })
    })
  }
}
