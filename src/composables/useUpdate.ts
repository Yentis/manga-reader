import { checkUpdates, getApkAsset, getElectronAsset, GithubRelease } from '../services/updateService'
import { NotifyOptions } from '../classes/notifyOptions'
import { UrlNavigation } from '../classes/urlNavigation'
import { useQuasar } from 'quasar'
import useUrlNavigation from './useUrlNavigation'
import useNotification from './useNotification'

export default function useUpdate () {
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()
  const { notification } = useNotification()

  const showUpdateAvailable = (githubRelease: GithubRelease) => {
    const notifyOptions = new NotifyOptions(`Update available: ${githubRelease.tag_name}`)
    notifyOptions.type = 'positive'
    notifyOptions.position = 'bottom'
    notifyOptions.actions = [{
      label: 'Download',
      handler: () => {
        if ($q.platform.is.mobile) {
          const apkAsset = getApkAsset(githubRelease)
          if (!apkAsset) return
          window.location.href = apkAsset.browser_download_url
        } else {
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
    }).catch(error => {
      notification.value = new NotifyOptions(error, 'Failed to check for updates')
    })
  }

  return { doUpdateCheck }
}
