import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangakakalotWorker } from 'src/classes/sites/mangakakalot/mangakakalotWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const mangakakalotWorker = new MangakakalotWorker(request.requestConfig)

  doOperation(request, mangakakalotWorker)
})

export default Worker
