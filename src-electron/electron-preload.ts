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

contextBridge.exposeInMainWorld('mangaReader', {
  onDropboxToken: (callback: (event: IpcRendererEvent, token?: string) => void) => {
    ipcRenderer.on('dropbox-token', callback)
  },

  openURL: (url: string) => {
    shell.openExternal(url).catch((error) => console.error(error))
  },

  sendRequest: (options: HttpRequest) => {
    return new Promise((resolve, reject) => {
      const key = Math.random()
      ipcRenderer.on('net-response', (_event, resultKey, response) => {
        if (resultKey !== key) return
        resolve(response)
      })
      ipcRenderer.on('net-error', (_event, resultKey, error) => {
        if (resultKey !== key) return
        reject(error)
      })
      ipcRenderer.send('net', key, options)
    })
  }
})
