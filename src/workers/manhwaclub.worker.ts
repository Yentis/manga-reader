import { ManhwaClubWorker } from 'src/classes/sites/manhwaclub/manhwaclubWorker'
import { Worker } from '../classes/worker'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const worker = new ManhwaClubWorker()

  doOperation(request, worker)
})

export default Worker
