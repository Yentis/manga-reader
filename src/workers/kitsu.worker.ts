import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation, handlePromise } from './helper'
import { KitsuRequestType, RequestType } from 'src/enums/workerEnum'
import { Worker } from 'src/classes/worker'
import { KitsuWorker } from 'src/classes/sites/kitsu/kitsuWorker'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const kitsuWorker = new KitsuWorker(request.data.get('token') as string)

  let promise: Promise<unknown> | undefined
  switch (request.type) {
    case KitsuRequestType.USER_ID:
      promise = kitsuWorker.getUserId()
      break
    case KitsuRequestType.MANGA_SLUG:
      promise = kitsuWorker.searchMangaSlug(request.data.get('url') as string)
      break
    case KitsuRequestType.LIBRARY_INFO:
      promise = kitsuWorker.getLibraryInfo(request.data.get('mangaId') as string, request.data.get('userId') as string)
      break
    case KitsuRequestType.LOGIN:
      promise = kitsuWorker.doLogin({ username: request.data.get('username') as string, password: request.data.get('password') as string })
      break
  }

  if (promise) {
    handlePromise(request.type, promise)
    return
  }

  doOperation(request, kitsuWorker)
})

export default Worker
