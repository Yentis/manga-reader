import { Dropbox, DropboxAuth } from 'dropbox'
import { Manga } from 'src/classes/manga'
import { migrateInput } from './migrationService'
import fetch from 'isomorphic-fetch'
import { LocalStorage } from 'quasar'
import { getShareId, setShareId } from './rentryService'
import constants from 'src/classes/constants'
import { getPlatform } from './platformService'
import { Platform } from 'src/enums/platformEnum'

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
const CLIENT_ID = 'uoywjq0b8q2208f'

let accessToken: string = LocalStorage.getItem(constants.DROPBOX_TOKEN) || ''

export function getAccessToken (): string {
  return accessToken
}

export function setAccessToken (token: string | undefined) {
  if (!token) return

  accessToken = token
  LocalStorage.set(constants.DROPBOX_TOKEN, token)
}

export async function getAuthUrl (): Promise<string> {
  const baseUrl = getPlatform() !== Platform.Static ? 'http://localhost/' : `${document.location.href}`
  const redirectUrl = baseUrl.endsWith('/') ? `${baseUrl}redirect` : `${baseUrl}/redirect`

  const authUrl = await new DropboxAuth({
    clientId: CLIENT_ID
  }).getAuthenticationUrl(redirectUrl)

  return authUrl.toString()
}

export function saveList (mangaList: Manga[]): Promise<void> {
  if (!accessToken) return Promise.reject(Error('No access token'))

  return new Promise((resolve, reject) => {
    const contents = JSON.stringify(mangaList)

    if (contents.length >= UPLOAD_FILE_SIZE_LIMIT) return reject(Error('File too large'))

    const promises = []

    promises.push(
      new Dropbox({
        accessToken,
        fetch
      }).filesUpload({
        path: `/${constants.MANGA_LIST_FILENAME}`,
        contents,
        mode: {
          '.tag': 'overwrite'
        }
      })
    )

    const shareId = getShareId()
    if (shareId) {
      promises.push(
        new Dropbox({
          accessToken,
          fetch
        }).filesUpload({
          path: `/${constants.SHARE_FILENAME}`,
          contents: JSON.stringify({ id: shareId }),
          mode: {
            '.tag': 'overwrite'
          }
        })
      )
    }

    Promise.all(promises).then(() => resolve()).catch((error) => reject(error))
  })
}

export function readList (): Promise<Manga[]> {
  if (!accessToken) return Promise.reject(Error('No access token'))

  return new Promise((resolve, reject) => {
    const promises = []

    promises.push(
      new Dropbox({
        accessToken,
        fetch
      }).filesDownload({
        path: `/${constants.SHARE_FILENAME}`
      })
    )

    promises.push(
      new Dropbox({
        accessToken,
        fetch
      }).filesDownload({
        path: `/${constants.MANGA_LIST_FILENAME}`
      })
    )

    Promise.all(promises).then(responses => {
      const shareFile = responses[0].result as unknown as { fileBlob: Blob }
      const mangaListFile = responses[1].result as unknown as { fileBlob: Blob }

      const shareReader = new FileReader()
      const mangaListReader = new FileReader()

      shareReader.onload = function () {
        if (typeof this.result !== 'string') return
        setShareId((JSON.parse(this.result) as { id: string }).id)
      }

      mangaListReader.onload = async function () {
        if (typeof this.result !== 'string') return reject(Error('Failed to read file'))
        const mangaList = await migrateInput(this.result)
        resolve(JSON.parse(mangaList))
      }

      shareReader.readAsText(shareFile.fileBlob)
      mangaListReader.readAsText(mangaListFile.fileBlob)
    }).catch((error) => reject(error))
  })
}
