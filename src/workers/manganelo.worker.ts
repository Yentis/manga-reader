import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { ManganeloWorker } from 'src/classes/sites/manganelo/manganeloWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const manganeloWorker = new ManganeloWorker()

  doOperation(request, manganeloWorker)
})

export default Worker
