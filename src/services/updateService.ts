import axios from 'axios'
import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { version } from '../../package.json'

const migrationVersion: string = LocalStorage.getItem(constants().MIGRATION_VERSION) || ''

export async function getChangelog (): Promise<string | undefined> {
  if (migrationVersion === version) return
  const releases = await getReleases()
  const latestFeatureRelease = releases.find(release => release.tag_name.endsWith('0'))
  if (!latestFeatureRelease) return 'No release found, please notify Yentis#5218 on Discord.'

  return latestFeatureRelease.body
}

export async function checkUpdates (): Promise<GithubRelease | undefined> {
  const latestRelease = (await getReleases())[0]
  if (latestRelease.tag_name !== version) {
    return latestRelease
  }
}

async function getReleases (): Promise<GithubRelease[]> {
  const response = await axios.get('https://api.github.com/repos/Yentis/manga-reader/releases')
  return response.data as Array<GithubRelease>
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
