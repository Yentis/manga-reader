import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangakakalotWorker } from 'src/classes/sites/mangakakalot/mangakakalotWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const mangakakalotWorker = new MangakakalotWorker()

  doOperation(request, mangakakalotWorker)
})

export default Worker
