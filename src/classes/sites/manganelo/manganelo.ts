import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { ManganeloWorker } from './manganeloWorker'

const LOGIN_URL = `https://user.${ManganeloWorker.siteType}/login?l=manganelo`

export class Manganelo extends BaseSite {
  siteType = ManganeloWorker.siteType
  WorkerClass = Worker

  getLoginUrl (): string {
    return LOGIN_URL
  }

  getTestUrl (): string {
    return ManganeloWorker.testUrl
  }
}
