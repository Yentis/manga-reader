import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const mangadexWorker = new MangaDexWorker(request.requestConfig)

  doOperation(request, mangadexWorker)
})

export default Worker
