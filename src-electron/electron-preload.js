const { contextBridge, ipcRenderer, shell } = require('electron')

const whitelist = [
  'http://localhost',
  'file:///',
  'dropbox.com/oauth2/authorize'
]

const matchingItem = whitelist.find(item => window.location.href.includes(item))
if (!matchingItem) {
  delete window.require;
  delete window.exports;
  delete window.module;
}

contextBridge.exposeInMainWorld('mangaReader', {
  onDropboxToken: (callback) => {
    ipcRenderer.on('dropbox-token', callback)
  },

  onGitlabToken: (callback) => {
    ipcRenderer.on('gitlab-token', callback)
  },

  openURL: (url) => {
    shell.openExternal(url)
  }
})
