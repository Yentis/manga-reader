import dropbox from 'dropbox'
import { Manga } from 'src/classes/manga'
import fetch from 'isomorphic-fetch'
import { LocalStorage } from 'quasar'

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
const MANGA_LIST_FILENAME = 'manga-reader.json'
const CLIENT_ID = 'uoywjq0b8q2208f'
const DROPBOX_TOKEN_KEY = 'dropbox_token'

let accessToken: string = LocalStorage.getItem(DROPBOX_TOKEN_KEY) || ''

export function getAccessToken (): string {
  return accessToken
}

export function setAccessToken (token: string | undefined) {
  if (!token) return

  accessToken = token
  LocalStorage.set(DROPBOX_TOKEN_KEY, token)
}

export function getAuthUrl () {
  return new dropbox.Dropbox({
    clientId: CLIENT_ID
  }).getAuthenticationUrl('http://localhost/redirect')
}

export function cordovaLogin (): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.open = cordova.InAppBrowser.open
    new dropbox.Dropbox({
      clientId: CLIENT_ID
    }).authenticateWithCordova(token => {
      delete window.open
      resolve(token)
    }, () => {
      delete window.open
      reject(Error('Failed to get token'))
    })
  })
}

export function saveList (mangaList: Manga[]): Promise<void> {
  if (!accessToken) return Promise.reject(Error('No access token'))

  return new Promise((resolve, reject) => {
    const contents = JSON.stringify(mangaList)

    if (contents.length >= UPLOAD_FILE_SIZE_LIMIT) return reject(Error('File too large'))

    new dropbox.Dropbox({
      accessToken,
      fetch
    }).filesUpload({
      path: `/${MANGA_LIST_FILENAME}`,
      contents,
      mode: {
        '.tag': 'overwrite'
      }
    }).then(() => resolve()).catch((error: dropbox.files.Error) => reject(Error(error.response.statusText)))
  })
}

export function readList (): Promise<Manga[]> {
  if (!accessToken) return Promise.reject(Error('No access token'))

  return new Promise((resolve, reject) => {
    new dropbox.Dropbox({
      accessToken,
      fetch
    }).filesDownload({
      path: `/${MANGA_LIST_FILENAME}`
    }).then(response => {
      const reader = new FileReader()

      reader.onload = function () {
        if (typeof this.result !== 'string') return reject(Error('Failed to read file'))
        resolve(JSON.parse(this.result))
      }

      reader.readAsText(response.fileBlob)
    }).catch((error: dropbox.files.Error) => reject(Error(error.response.statusText)))
  })
}
