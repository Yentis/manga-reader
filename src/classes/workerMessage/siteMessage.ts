import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteType } from 'src/enums/siteEnum'
import { BaseSite } from '../sites/baseSite'
import { BaseWorkerMessage } from './baseMessage'

export class SiteWorkerMessage extends BaseWorkerMessage {
  siteType: SiteType | LinkingSiteType

  constructor (type: string, data: Map<string, string>, site: BaseSite) {
    super(type, data)
    this.siteType = site.siteType
  }
}
