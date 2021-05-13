import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangagoWorker } from 'src/classes/sites/mangago/mangagoWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const mangagoWorker = new MangagoWorker(request.platform, request.requestConfig)

  doOperation(request, mangagoWorker)
})

export default Worker
