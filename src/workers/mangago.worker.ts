import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { MangagoWorker } from 'src/classes/sites/mangago/mangagoWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const mangagoWorker = new MangagoWorker()

  doOperation(request, mangagoWorker)
})

export default Worker
