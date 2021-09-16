import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { WebtoonsWorker } from 'src/classes/sites/webtoons/webtoonsWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const webtoonsWorker = new WebtoonsWorker()

  doOperation(request, webtoonsWorker)
})

export default Worker
