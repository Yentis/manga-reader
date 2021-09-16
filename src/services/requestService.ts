import { QVueGlobals } from 'quasar/dist/types'
import BaseRequest from 'src/classes/requests/baseRequest'
import BrowserRequest from 'src/classes/requests/browserRequest'
import CordovaRequest from 'src/classes/requests/cordovaRequest'
import ElectronRequest from 'src/classes/requests/electronRequest'

export let requestHandler: BaseRequest

export function init ($q: QVueGlobals) {
  if ($q.platform.is.cordova) {
    requestHandler = new CordovaRequest()
  } else if ($q.platform.is.electron) {
    requestHandler = new ElectronRequest()
  } else {
    requestHandler = new BrowserRequest()
  }
}
