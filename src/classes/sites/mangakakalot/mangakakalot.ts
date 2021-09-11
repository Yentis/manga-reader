import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { MangakakalotWorker } from './mangakakalotWorker'
import { ManganeloWorker } from '../manganelo/manganeloWorker'

const LOGIN_URL = `https://user.${ManganeloWorker.siteType}/login?l=mangakakalot`

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
