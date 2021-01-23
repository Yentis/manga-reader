import { SiteType } from '../../../enums/siteEnum'
import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/wordpress.worker'
import { WordPressWorker } from './wordpressWorker'

export class WordPress extends BaseSite {
  siteType: SiteType;
  WorkerClass = Worker

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getUrl (): string {
    return WordPressWorker.getUrl(this.siteType)
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getTestUrl (): string {
    return WordPressWorker.getTestUrl(this.siteType)
  }
}
