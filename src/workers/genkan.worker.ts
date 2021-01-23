import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const genkanWorker = new GenkanWorker(request.siteType, request.requestConfig)

  doOperation(request, genkanWorker)
})

export default Worker
