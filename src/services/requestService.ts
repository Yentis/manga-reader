import BaseRequest from 'src/classes/requests/baseRequest'
import BrowserRequest from 'src/classes/requests/browserRequest'
import CordovaRequest from 'src/classes/requests/cordovaRequest'
import ElectronRequest from 'src/classes/requests/electronRequest'
import { Platform } from 'src/enums/platformEnum'
import { getPlatform } from './platformService'

export let requestHandler: BaseRequest

export function init () {
  switch (getPlatform()) {
    case Platform.Cordova:
      requestHandler = new CordovaRequest()
      break
    case Platform.Electron:
      requestHandler = new ElectronRequest()
      break
    case Platform.Static:
      requestHandler = new BrowserRequest()
      break
  }
}
