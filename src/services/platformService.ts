import { Platform } from 'quasar'
import { Platform as PlatformType } from 'src/enums/platformEnum'

export function getPlatform(): PlatformType {
  if (Platform.is?.cordova) return PlatformType.Cordova
  if (Platform.is?.electron) return PlatformType.Electron
  return PlatformType.Static
}
