import type { IpcRendererEvent } from 'electron'
import { contextBridge, ipcRenderer, shell } from 'electron'
import type { HttpRequest } from 'src/interfaces/httpRequest'
import type qs from 'qs'
import type ElectronWindow from 'src/interfaces/electronWindow'
import type HttpResponse from 'src/interfaces/httpResponse'

const whitelist = ['http://localhost', 'file:///', 'dropbox.com/oauth2/authorize']

const matchingItem = whitelist.find((item) => window.location.href.includes(item))
if (!matchingItem) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.require
  delete window.exports
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.module
}

let dropboxTokenCallback: ((event: IpcRendererEvent, queryString?: qs.ParsedQs) => void) | undefined

ipcRenderer.on('dropbox-token', (event: IpcRendererEvent, queryString?: qs.ParsedQs) => {
  if (!dropboxTokenCallback) return
  dropboxTokenCallback(event, queryString)
})

const publicMethods: ElectronWindow['mangaReader'] = {
  onDropboxToken: (callback: (event: IpcRendererEvent, queryString?: qs.ParsedQs) => void): void => {
    dropboxTokenCallback = callback
  },

  openURL: (url: string): void => {
    shell.openExternal(url).catch((error) => console.error(error))
  },

  sendRequest: (options: HttpRequest): Promise<HttpResponse> => {
    return ipcRenderer.invoke('net-request', options)
  },

  setCookieNames: (cookieNames: string[]): Promise<void> => {
    return ipcRenderer.invoke('cookie-names', cookieNames)
  },
}

contextBridge.exposeInMainWorld('mangaReader', publicMethods)
