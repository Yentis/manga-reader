import { QVueGlobals } from 'quasar/dist/types'
import { Platform } from 'src/enums/platformEnum'

export function getPlatform ($q: QVueGlobals): Platform {
  if ($q.platform.is.cordova) return Platform.Cordova
  if ($q.platform.is.electron) return Platform.Electron
  return Platform.Static
}
