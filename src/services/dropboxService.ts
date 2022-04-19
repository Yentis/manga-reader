import { Dropbox, DropboxAuth, DropboxResponse, DropboxResponseError } from 'dropbox'
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
  id: string
  editCode: string
}

export interface ReadListResponse {
  mangaList: Manga[]
  shareContents?: ShareContents
}

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
const CLIENT_ID = 'uoywjq0b8q2208f'

export function getAccessToken (): string {
  const accessToken = LocalStorage.getItem(constants.DROPBOX_TOKEN)
  if (typeof accessToken !== 'string') return ''
  return accessToken
}

export function setAccessToken (token: string | undefined) {
  if (token === undefined) return
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

export async function saveList (mangaList: Manga[]): Promise<void> {
  const accessToken = getAccessToken()
  if (!accessToken) throw Error('No access token')

  const contents = JSON.stringify(mangaList)
  if (contents.length >= UPLOAD_FILE_SIZE_LIMIT) throw Error('File too large')

  const promises: Promise<unknown>[] = []

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
    await Promise.all(promises)
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

  await Promise.all(promises)
}

export async function readList (): Promise<ReadListResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) throw Error('No access token')

  const shareText = await readFile(`/${constants.SHARE_FILENAME}`, accessToken)
  const shareContents = shareText ? (JSON.parse(shareText) as ShareContents) : undefined

  const mangaListText = await readFile(`/${constants.MANGA_LIST_FILENAME}`, accessToken)
  const migratedManga = mangaListText ? (await migrateInput(mangaListText)) : undefined
  const mangaList = migratedManga ? (JSON.parse(migratedManga) as Manga[]) : []

  return {
    mangaList,
    shareContents
  }
}

async function readFile (path: string, accessToken: string): Promise<string | undefined> {
  let response: DropboxResponse<files.FileMetadata> | undefined
  try {
    response = await new Dropbox({
      accessToken,
      fetch
    }).filesDownload({
      path
    })
  } catch (error) {
    if (error instanceof DropboxResponseError) {
      // File not found
      if (error.status !== 409) throw error
    }
  }

  if (!response) return undefined
  const file = response.result as unknown as { fileBlob: Blob }
  const reader = new FileReader()

  const readPromise = new Promise<string | undefined>((resolve) => {
    reader.onload = function () {
      if (typeof this.result !== 'string') {
        resolve(undefined)
        return
      }

      resolve(this.result)
    }
  })

  reader.readAsText(file.fileBlob)
  return readPromise
}
