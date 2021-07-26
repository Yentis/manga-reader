import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/catmanga.worker'
import { CatMangaWorker } from './catmangaWorker'

export class CatManga extends BaseSite {
  siteType = CatMangaWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return CatMangaWorker.testUrl
  }
}
