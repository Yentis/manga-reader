import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron'
import HttpRequest from 'src/interfaces/httpRequest'

const whitelist = [
  'http://localhost',
  'file:///',
  'dropbox.com/oauth2/authorize'
]

const matchingItem = whitelist.find(item => window.location.href.includes(item))
if (!matchingItem) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.require
  delete window.exports
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.module
}

let dropboxTokenCallback: ((event: IpcRendererEvent, token?: string) => void) | undefined

ipcRenderer.on('dropbox-token', (event: IpcRendererEvent, token?: string) => {
  if (!dropboxTokenCallback) return
  dropboxTokenCallback(event, token)
})

contextBridge.exposeInMainWorld('mangaReader', {
  onDropboxToken: (callback: (event: IpcRendererEvent, token?: string) => void) => {
    dropboxTokenCallback = callback
  },

  openURL: (url: string) => {
    shell.openExternal(url).catch((error) => console.error(error))
  },

  sendRequest: (options: HttpRequest) => {
    return ipcRenderer.invoke('net-request', options)
  }
})
