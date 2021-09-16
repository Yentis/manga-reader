import { Worker } from '../classes/worker'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { GenkanioWorker } from '../classes/sites/genkanio/genkanioWorker'
import { doOperation } from './helper'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const worker = new GenkanioWorker()

  doOperation(request, worker)
})

export default Worker
