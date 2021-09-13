import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { WebtoonsWorker } from 'src/classes/sites/webtoons/webtoonsWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const webtoonsWorker = new WebtoonsWorker(request.platform, request.requestConfig)

  doOperation(request, webtoonsWorker)
})

export default Worker
