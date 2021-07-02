import { LinkingSiteType } from '../../../enums/linkingSiteEnum'
import { BaseWorker } from '../baseWorker'
import { Manga } from '../../manga'
import qs from 'qs'
import axios, { AxiosRequestConfig } from 'axios'

export interface LoginResponse {
  'access_token': string
}

interface BasicResponse {
  data: { id: string }[]
}

export interface Data {
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

export class KitsuWorker extends BaseWorker {
  static siteType = LinkingSiteType.Kitsu
  static url = BaseWorker.getUrl(KitsuWorker.siteType)
  static testUrl = ''

  token: string

  constructor (token: string, requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(KitsuWorker.siteType, requestConfig)
    this.token = token
  }

  async doLogin (data: { username: string, password: string }): Promise<Error | LoginResponse> {
    const response = await axios.post(`${KitsuWorker.url}/api/oauth/token`, {
      grant_type: 'password',
      username: data.username,
      password: data.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return response.data as LoginResponse
  }

  async syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    if (chapterNum === 0) {
      return
    }

    await axios.patch(`${KitsuWorker.url}/api/edge/library-entries/${mangaId}`, {
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
  }

  readUrl (url: string): Promise<Error | Manga> {
    return Promise.resolve(Error(`Could not read ${url}, not implemented.`))
  }

  async search (query: string): Promise<Error | Manga[]> {
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

    const response = await axios.get(`${KitsuWorker.url}/api/edge/library-entries?${queryString}`)
    const libraryEntriesResponse = response.data as LibraryEntriesResponse
    const mangaList: Manga[] = []

    if (!libraryEntriesResponse.included) return mangaList

    libraryEntriesResponse.included.forEach(entry => {
      const library = libraryEntriesResponse.data.find(library => {
        return library.relationships.manga.data.id === entry.id
      })
      const title = Object.values(entry.attributes.titles).find(title => this.titleContainsQuery(query, title))

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

  async getUserId (): Promise<Error | string> {
    const queryString = qs.stringify({
      'filter[self]': true,
      'fields[users]': 'id'
    })

    const response = await axios.get(`${KitsuWorker.url}/api/edge/users?${queryString}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })

    const usersResponse = response.data as BasicResponse
    if (usersResponse.data.length === 0) return Error('Response did not contain ID')

    return usersResponse.data[0].id
  }

  async searchMangaSlug (url: string): Promise<Error | string> {
    const queryString = qs.stringify({
      'fields[manga]': 'id',
      'filter[slug]': url
    })

    const response = await axios.get(`${KitsuWorker.url}/api/edge/manga?${queryString}`)
    const mangaResponse = response.data as BasicResponse

    if (mangaResponse.data.length === 0) return Error('Response did not contain ID')
    return mangaResponse.data[0].id
  }

  async getLibraryInfo (mangaId: string, userId: string): Promise<Error | Data> {
    const queryString = qs.stringify({
      'filter[manga_id]': mangaId,
      'filter[user_id]': userId
    })

    const response = await axios.get(`${KitsuWorker.url}/api/edge/library-entries?${queryString}`)
    const libraryResponse = response.data as LibraryEntriesResponse

    if (libraryResponse.data.length === 0) return Error('Response did not contain info')
    return libraryResponse.data[0]
  }
}
