import HttpRequest from 'src/interfaces/httpRequest'
import { version } from '../../package.json'
import { getMigrationVersion } from './migrationService'
import { requestHandler } from './requestService'

export interface Asset {
  name: string
  'browser_download_url': string
}

export interface GithubRelease {
  name: string
  'tag_name': string
  'html_url': string
  assets: Asset[],
  body: string
}

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
    if (!release) continue

    if (i !== 0) changelog += '\n\n'
    changelog += release.tag_name + '\n' + '-----------' + '\n'
    changelog += release.body
  }

  return changelog
}

export async function checkUpdates (): Promise<GithubRelease | undefined> {
  const latestRelease = (await getReleases())[0]
  if (latestRelease?.tag_name !== version) {
    return latestRelease
  }
}

async function getReleases (): Promise<GithubRelease[]> {
  const request: HttpRequest = { method: 'GET', url: 'https://api.github.com/repos/Yentis/manga-reader/releases' }
  const response = await requestHandler.sendRequest(request)
  return JSON.parse(response.data) as GithubRelease[]
}

export function getApkAsset (githubRelease: GithubRelease): Asset | undefined {
  const apkAsset = githubRelease.assets.find(asset => {
    return asset.name === 'manga-reader.apk'
  })
  return apkAsset
}

export function getElectronAsset (githubRelease: GithubRelease): Asset | undefined {
  const zipAsset = githubRelease.assets.find(asset => {
    return asset.name === 'Manga.Reader-win32-x64.zip'
  })
  return zipAsset
}
