import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { ManganeloWorker } from 'src/classes/sites/manganelo/manganeloWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const manganeloWorker = new ManganeloWorker(request.requestConfig)

  doOperation(request, manganeloWorker)
})

export default Worker
