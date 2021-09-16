import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const mangadexWorker = new MangaDexWorker()

  doOperation(request, mangadexWorker)
})

export default Worker
