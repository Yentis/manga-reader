import { checkUpdates, getApkAsset, getElectronAsset, GithubRelease } from '../services/updateService'
import { NotifyOptions } from '../classes/notifyOptions'
import { UrlNavigation } from '../classes/urlNavigation'
import useUrlNavigation from './useUrlNavigation'
import useNotification from './useNotification'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'

export default function useUpdate () {
  const { urlNavigation } = useUrlNavigation()
  const { notification } = useNotification()

  const showUpdateAvailable = (githubRelease: GithubRelease) => {
    const platform = getPlatform()
    if (platform === Platform.Static) return

    const notifyOptions = new NotifyOptions(`Update available: ${githubRelease.tag_name}`)
    notifyOptions.type = 'positive'
    notifyOptions.position = 'bottom'
    notifyOptions.actions = [{
      label: 'Download',
      handler: () => {
        if (platform === Platform.Capacitor) {
          const apkAsset = getApkAsset(githubRelease)
          if (!apkAsset) return
          window.location.href = apkAsset.browser_download_url
        } else if (platform === Platform.Electron) {
          const electronAsset = getElectronAsset(githubRelease)
          if (!electronAsset) return
          urlNavigation.value = new UrlNavigation(electronAsset.browser_download_url, false)
        }
      },
      color: 'white'
    }]

    notification.value = notifyOptions
  }

  const doUpdateCheck = () => {
    checkUpdates().then(result => {
      if (!result) return
      showUpdateAvailable(result)
    }).catch((error: Error) => {
      notification.value = new NotifyOptions(error, 'Failed to check for updates')
    })
  }

  return { doUpdateCheck }
}
