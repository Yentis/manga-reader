const { contextBridge, ipcRenderer } = require('electron')

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

contextBridge.exposeInMainWorld('manga-reader', {
  onDropboxToken: (callback) => {
    ipcRenderer.on('dropbox-token', callback)
  },

  onGitlabToken: (callback) => {
    ipcRenderer.on('gitlab-token', callback)
  }
})
