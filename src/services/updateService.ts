import axios from 'axios'
import { version } from '../../package.json'
import { getMigrationVersion } from './migrationService'

export async function getChangelog (): Promise<string | undefined> {
  const migrationVersion = getMigrationVersion()
  if (migrationVersion === version) return
  const releases = await getReleases()

  let latestSeenReleaseIndex = releases.findIndex(release => release.tag_name === migrationVersion)
  if (latestSeenReleaseIndex === -1) latestSeenReleaseIndex = releases.findIndex(release => release.tag_name.endsWith('0'))
  else latestSeenReleaseIndex = Math.max(latestSeenReleaseIndex - 1, 0)
  if (latestSeenReleaseIndex === -1) return 'No release found, please notify Yentis#5218 on Discord.'

  let changelog = ''
  for (let i = 0; i < latestSeenReleaseIndex + 1; i++) {
    const release = releases[i]
    if (i !== 0) changelog += '\n\n'
    changelog += release.tag_name + '\n' + '-----------' + '\n'
    changelog += release.body
  }

  return changelog
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
