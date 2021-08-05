import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/manhwaclub.worker'
import { ManhwaClubWorker } from './manhwaclubWorker'

export class ManhwaClub extends BaseSite {
  siteType = ManhwaClubWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return ManhwaClubWorker.testUrl
  }
}
