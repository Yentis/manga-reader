import axios from 'axios'
import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { version } from '../../package.json'

const migrationVersion: string = LocalStorage.getItem(constants().MIGRATION_VERSION) || ''

export async function getChangelog (): Promise<string | undefined> {
  if (migrationVersion === version) return

  const latestRelease = await getLatestRelease()
  return latestRelease.body
}

export async function checkUpdates (): Promise<GithubRelease | undefined> {
  const latestRelease = await getLatestRelease()
  if (latestRelease.tag_name !== version) {
    return latestRelease
  }
}

async function getLatestRelease (): Promise<GithubRelease> {
  const response = await axios.get('https://api.github.com/repos/Yentis/manga-reader/releases')
  const releases = response.data as Array<GithubRelease>
  const latestRelease = releases[0]

  return latestRelease
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
    assets: Array<Asset>,
    body: string
}

export interface Asset {
    name: string
    'browser_download_url': string
}
