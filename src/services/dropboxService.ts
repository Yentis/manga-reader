import { Dropbox, DropboxAuth, DropboxResponse, DropboxResponseError } from 'dropbox'
import { Manga } from 'src/classes/manga'
import { migrateInput } from './migrationService'
import { LocalStorage } from 'quasar'
import { getEditCode, getShareId } from './rentryService'
import constants from 'src/classes/constants'
import { getPlatform } from './platformService'
import { Platform } from 'src/enums/platformEnum'
import { files } from 'dropbox/types/dropbox_types'
import qs from 'qs'

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

const dropboxAuth = new DropboxAuth({
  clientId: CLIENT_ID
})

let dropboxSession: Dropbox | undefined

export async function getAuthUrl (): Promise<string> {
  const redirectUrl = getRedirectUrl()
  const authUrl = await dropboxAuth.getAuthenticationUrl(redirectUrl, undefined, 'code', 'offline', undefined, undefined, true)

  const auth = getAuth() || {}
  LocalStorage.set(constants.DROPBOX_AUTH, {
    ...auth,
    code_verifier: dropboxAuth.getCodeVerifier()
  })

  return authUrl.toString()
}

export function getAuth (): qs.ParsedQs | undefined {
  const dropboxAuth = LocalStorage.getItem(constants.DROPBOX_AUTH)
  if (typeof dropboxAuth !== 'object') return undefined

  const queryString = dropboxAuth as qs.ParsedQs
  return queryString
}

export function setAuth (queryString: Record<string, unknown> | undefined) {
  if (!queryString) return

  const auth = getAuth() || {}
  LocalStorage.set(constants.DROPBOX_AUTH, {
    code_verifier: auth.code_verifier,
    ...queryString
  })
}

async function initAuth (): Promise<Dropbox | undefined> {
  let auth: Record<string, unknown> | undefined = getAuth()
  if (!auth) return undefined

  if (typeof auth.refresh_token !== 'string') {
    const codeVerifier = auth.code_verifier
    if (typeof codeVerifier !== 'string') return undefined
    dropboxAuth.setCodeVerifier(codeVerifier)

    const code = auth.code
    if (typeof code !== 'string') return undefined
    const response = await dropboxAuth.getAccessTokenFromCode(getRedirectUrl(), code)

    auth = response.result as Record<string, unknown>

    const expiresInSeconds = auth.expires_in
    if (typeof expiresInSeconds === 'number') {
      const accessTokenExpiresAt = new Date(Date.now() + (expiresInSeconds * 1000))
      auth.expires_at = accessTokenExpiresAt.toJSON()
      delete auth.expires_in
    }

    LocalStorage.set(constants.DROPBOX_AUTH, auth)
  }

  const accessToken = auth.access_token
  if (typeof accessToken !== 'string') return undefined

  const expiresAt = auth.expires_at
  if (typeof expiresAt !== 'string') return undefined
  const accessTokenExpiresAt = new Date(expiresAt)

  const refreshToken = auth.refresh_token
  if (typeof refreshToken !== 'string') return undefined

  dropboxAuth.setAccessToken(accessToken)
  dropboxAuth.setAccessTokenExpiresAt(accessTokenExpiresAt)
  dropboxAuth.setRefreshToken(refreshToken)

  dropboxSession = new Dropbox({
    auth: dropboxAuth
  })

  return dropboxSession
}

async function tryRefreshAccessToken (): Promise<void> {
  const refreshPromise = (dropboxAuth.checkAndRefreshAccessToken() as unknown)
  await refreshPromise as Promise<unknown>

  const accessToken = dropboxAuth.getAccessToken()
  const accessTokenExpiresAt = dropboxAuth.getAccessTokenExpiresAt()

  const auth = getAuth()

  setAuth({
    ...auth,
    access_token: accessToken,
    expires_at: accessTokenExpiresAt
  })
}

function getRedirectUrl (): string {
  const baseUrl = getPlatform() !== Platform.Static
    ? 'http://localhost/'
    : `${document.location.origin + document.location.pathname}`

  if (baseUrl.includes('/redirect')) return baseUrl
  return baseUrl.endsWith('/') ? `${baseUrl}redirect` : `${baseUrl}/redirect`
}

export async function saveList (mangaList: Manga[]): Promise<void> {
  const dropbox = dropboxSession || await initAuth()
  if (!dropbox) throw new DropboxResponseError(401, {}, Error('Failed to init auth'))
  await tryRefreshAccessToken()

  const contents = JSON.stringify(mangaList)
  if (contents.length >= UPLOAD_FILE_SIZE_LIMIT) throw Error('File too large')

  const promises: Promise<unknown>[] = []

  promises.push(
    dropbox.filesUpload({
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
    dropbox.filesUpload({
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
  const dropbox = dropboxSession || await initAuth()
  if (!dropbox) throw new DropboxResponseError(401, {}, Error('Failed to init auth'))
  await tryRefreshAccessToken()

  const shareText = await readFile(`/${constants.SHARE_FILENAME}`, dropbox)
  const shareContents = shareText ? (JSON.parse(shareText) as ShareContents) : undefined

  const mangaListText = await readFile(`/${constants.MANGA_LIST_FILENAME}`, dropbox)
  const migratedManga = mangaListText ? (await migrateInput(mangaListText)) : undefined
  const mangaList = migratedManga ? (JSON.parse(migratedManga) as Manga[]) : []

  return {
    mangaList,
    shareContents
  }
}

async function readFile (path: string, dropbox: Dropbox): Promise<string | undefined> {
  let response: DropboxResponse<files.FileMetadata> | undefined

  try {
    response = await dropbox.filesDownload({
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
