import { Dropbox, DropboxAuth, DropboxResponse } from 'dropbox'
import { Manga } from 'src/classes/manga'
import { migrateInput } from './migrationService'
import fetch from 'isomorphic-fetch'
import { LocalStorage } from 'quasar'
import { getEditCode, getShareId } from './rentryService'
import constants from 'src/classes/constants'
import { getPlatform } from './platformService'
import { Platform } from 'src/enums/platformEnum'
import { files } from 'dropbox/types/dropbox_types'

interface ShareContents {
  id: string,
  editCode: string
}

export interface ReadListResponse {
  mangaList: Manga[],
  shareContents?: ShareContents
}

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
    const editCode = getEditCode()

    if (!shareId && !editCode) {
      Promise.all(promises).then(() => resolve()).catch((error) => reject(error))
      return
    }

    const shareContents: ShareContents = {
      id: shareId,
      editCode
    }

    promises.push(
      new Dropbox({
        accessToken,
        fetch
      }).filesUpload({
        path: `/${constants.SHARE_FILENAME}`,
        contents: JSON.stringify(shareContents),
        mode: {
          '.tag': 'overwrite'
        }
      })
    )

    Promise.all(promises).then(() => resolve()).catch((error) => reject(error))
  })
}

export async function readList (): Promise<ReadListResponse> {
  if (!accessToken) throw Error('No access token')
  const downloadPromises: Promise<DropboxResponse<files.FileMetadata>>[] = []

  downloadPromises.push(
    new Dropbox({
      accessToken,
      fetch
    }).filesDownload({
      path: `/${constants.SHARE_FILENAME}`
    })
  )

  downloadPromises.push(
    new Dropbox({
      accessToken,
      fetch
    }).filesDownload({
      path: `/${constants.MANGA_LIST_FILENAME}`
    })
  )

  const [shareResponse, mangaListResponse] = await Promise.all(downloadPromises)
  if (!shareResponse || !mangaListResponse) throw Error('Failed to get response')

  const shareFile = shareResponse.result as unknown as { fileBlob: Blob }
  const mangaListFile = mangaListResponse.result as unknown as { fileBlob: Blob }

  const shareReader = new FileReader()
  const mangaListReader = new FileReader()

  const readPromises: Promise<unknown>[] = []
  readPromises.push(new Promise<ShareContents | undefined>((resolve) => {
    shareReader.onload = function () {
      if (typeof this.result !== 'string') {
        resolve(undefined)
        return
      }

      resolve(JSON.parse(this.result) as ShareContents)
    }
  }))

  readPromises.push(new Promise<Manga[]>((resolve, reject) => {
    mangaListReader.onload = async function () {
      if (typeof this.result !== 'string') {
        reject(Error('Failed to read file'))
        return
      }

      const migratedManga = await migrateInput(this.result)
      resolve(JSON.parse(migratedManga) as Manga[])
    }
  }))

  shareReader.readAsText(shareFile.fileBlob)
  mangaListReader.readAsText(mangaListFile.fileBlob)

  const readResponses = await Promise.all(readPromises)
  const shareContents = readResponses[0] as ShareContents | undefined
  const mangaList = readResponses[1] as Manga[]

  return {
    mangaList,
    shareContents
  }
}
