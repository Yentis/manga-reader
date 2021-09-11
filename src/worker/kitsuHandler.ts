/* eslint-disable @typescript-eslint/ban-ts-comment */

import { KitsuWorker } from 'src/classes/sites/kitsu/kitsuWorker'
import { WorkerRequest } from 'src/classes/workerRequest'
import { KitsuRequestType } from 'src/enums/workerEnum'

export default function handleKitsuRequest (request: WorkerRequest, worker: KitsuWorker): boolean {
  switch (request.type) {
    case KitsuRequestType.USER_ID:
      worker.getUserId().then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return true
    case KitsuRequestType.MANGA_SLUG:
      worker.searchMangaSlug(request.data.get('url') as string).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return true
    case KitsuRequestType.LIBRARY_INFO:
      worker.getLibraryInfo(request.data.get('mangaId') as string, request.data.get('userId') as string).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return true
    case KitsuRequestType.LOGIN:
      worker.doLogin({ username: request.data.get('username') as string, password: request.data.get('password') as string }).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return true
    default:
      return false
  }
}
