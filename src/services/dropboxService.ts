import dropbox from 'dropbox'
import { Manga } from 'src/classes/manga'
import { migrateInput } from './migrationService'
import fetch from 'isomorphic-fetch'
import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { getShareId, setShareId } from './gitlabService'

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
const CLIENT_ID = 'uoywjq0b8q2208f'

let accessToken: string = LocalStorage.getItem(constants().DROPBOX_TOKEN) || ''

export function getAccessToken (): string {
  return accessToken
}

export function setAccessToken (token: string | undefined) {
  if (!token) return

  accessToken = token
  LocalStorage.set(constants().DROPBOX_TOKEN, token)
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

    const promises = []

    promises.push(
      new dropbox.Dropbox({
        accessToken,
        fetch
      }).filesUpload({
        path: `/${constants().MANGA_LIST_FILENAME}`,
        contents,
        mode: {
          '.tag': 'overwrite'
        }
      })
    )

    const shareId = getShareId()
    if (shareId) {
      promises.push(
        new dropbox.Dropbox({
          accessToken,
          fetch
        }).filesUpload({
          path: `/${constants().SHARE_FILENAME}`,
          contents: JSON.stringify({ id: shareId }),
          mode: {
            '.tag': 'overwrite'
          }
        })
      )
    }

    Promise.all(promises).then(() => resolve()).catch((error: dropbox.files.Error) => reject(Error(error.response.statusText)))
  })
}

export function readList (): Promise<Manga[]> {
  if (!accessToken) return Promise.reject(Error('No access token'))

  return new Promise((resolve, reject) => {
    const promises = []

    promises.push(
      new dropbox.Dropbox({
        accessToken,
        fetch
      }).filesDownload({
        path: `/${constants().SHARE_FILENAME}`
      })
    )

    promises.push(
      new dropbox.Dropbox({
        accessToken,
        fetch
      }).filesDownload({
        path: `/${constants().MANGA_LIST_FILENAME}`
      })
    )

    Promise.all(promises).then(responses => {
      const shareFile = responses[0]
      const mangaListFile = responses[1]

      const shareReader = new FileReader()
      const mangaListReader = new FileReader()

      shareReader.onload = function () {
        if (typeof this.result !== 'string') return
        setShareId((JSON.parse(this.result) as { id: string }).id)
      }

      mangaListReader.onload = function () {
        if (typeof this.result !== 'string') return reject(Error('Failed to read file'))
        resolve(JSON.parse(migrateInput(this.result)))
      }

      shareReader.readAsText(shareFile.fileBlob)
      mangaListReader.readAsText(mangaListFile.fileBlob)
    }).catch((error: dropbox.files.Error) => reject(Error(error.response.statusText)))
  })
}
