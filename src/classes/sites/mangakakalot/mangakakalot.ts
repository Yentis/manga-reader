import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/mangakakalot.worker'
import { MangakakalotWorker } from './mangakakalotWorker'

const LOGIN_URL = 'https://user.manganelo.com/login?l=mangakakalot'

export class Mangakakalot extends BaseSite {
  siteType = MangakakalotWorker.siteType
  WorkerClass = Worker

  getLoginUrl (): string {
    return LOGIN_URL
  }

  getTestUrl (): string {
    return MangakakalotWorker.testUrl
  }
}
