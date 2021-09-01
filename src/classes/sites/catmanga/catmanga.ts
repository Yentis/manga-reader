import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { CatMangaWorker } from './catmangaWorker'

export class CatManga extends BaseSite {
  siteType = CatMangaWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return CatMangaWorker.testUrl
  }
}
