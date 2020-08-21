import axios from 'axios'
import { version } from '../../package.json'

export function checkUpdates (): Promise<GithubRelease | undefined> {
  return new Promise((resolve, reject) => {
    axios.get('https://api.github.com/repos/Yentis/manga-reader/releases').then(response => {
      const releases = response.data as Array<GithubRelease>
      const latestRelease = releases[0]

      if (latestRelease.tag_name !== version) {
        resolve(latestRelease)
      } else {
        resolve()
      }
    }).catch(error => reject(error))
  })
}

export function getApkAsset (githubRelease: GithubRelease): Asset | undefined {
  const apkAsset = githubRelease.assets.find(asset => {
    return asset.name.endsWith('.apk')
  })
  return apkAsset
}

export function getElectronAsset (githubRelease: GithubRelease): Asset | undefined {
  const zipAsset = githubRelease.assets.find(asset => {
    return asset.name.endsWith('.zip')
  })
  return zipAsset
}

export interface GithubRelease {
    name: string
    'tag_name': string
    'html_url': string
    assets: Array<Asset>
}

export interface Asset {
    name: string
    'browser_download_url': string
}
