import { LocalStorage } from 'quasar'
import { QVueGlobals } from 'quasar/dist/types'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from '../classes/urlNavigation'
import constants from 'src/classes/constants'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { configure, BFSRequire } from 'browserfs/dist/node/index'
import { FSModule } from 'browserfs/dist/node/core/FS'
import axios from 'axios'
import qs from 'qs'
import { getPlatform } from './platformService'
import { Platform } from 'src/enums/platformEnum'

const CLIENT_ID = '1ac7147c66b40b6aaae3f3fd0cac5169d26fd4b406e6198f4b3fd1fd29d9816a'
const GITLAB_DIR = '/gitlab'
const SNIPPET_FILE_NAME = 'manga_list.json'

interface SnippetResponse {
  id: number
}

configure({
  fs: 'InMemory',
  options: {}
}, (error) => {
  if (error) console.error(error)
})

const fs = BFSRequire('fs')
let initialized = false

async function initGit (shareId: string) {
  if (initialized) return
  initialized = true

  await mkdir(GITLAB_DIR)
  await git.clone({
    fs,
    http,
    dir: GITLAB_DIR,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: `https://gitlab.com/snippets/${shareId}.git`,
    singleBranch: true,
    depth: 3
  })
}

function mkdir (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, '0777', (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

async function resetToOldestCommit (fs: FSModule) {
  const dir = GITLAB_DIR
  const commits = await git.log({ fs, dir })
  if (commits.length <= 1) return

  const oldestCommit = commits[commits.length - 1].oid
  const data = new TextEncoder().encode(oldestCommit)
  const branch = await git.currentBranch({ fs, dir })
  if (typeof branch !== 'string') return

  await writeFile(`${dir}/.git/refs/heads/${branch}`, Buffer.from(data))
  await git.resetIndex({ fs, dir, filepath: SNIPPET_FILE_NAME })
  await git.checkout({ fs, dir })
}

function writeFile (path: string, data: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

export function getShareId (): string {
  return LocalStorage.getItem(constants.SHARE_ID) || ''
}

function getAccessToken (): string {
  return LocalStorage.getItem(constants.GITLAB_TOKEN) || ''
}

export function setAccessToken (token: string | undefined) {
  if (!token) return
  LocalStorage.set(constants.GITLAB_TOKEN, token)
}

export function getAuthUrl ($q: QVueGlobals) {
  const baseUrl = getPlatform($q) !== Platform.Static ? 'http://localhost/' : `${document.location.href}`
  const redirectUrl = baseUrl.endsWith('/') ? `${baseUrl}redirect_gitlab` : `${baseUrl}/redirect_gitlab`

  return `https://gitlab.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUrl}&response_type=token&scope=api`
}

export function setShareId (id: string | undefined) {
  if (id === undefined) return
  LocalStorage.set(constants.SHARE_ID, id)
}

export async function createList (list: string): Promise<string> {
  const shareId = getShareId()
  if (shareId) {
    return Promise.resolve(shareId)
  }

  const accessToken = getAccessToken()
  if (!accessToken) {
    throw Error('Not logged in')
  }

  const queryString = qs.stringify({
    access_token: getAccessToken()
  })

  const response = await axios.post(`https://gitlab.com/api/v4/snippets?${queryString}`, {
    title: 'My Manga List',
    files: [{
      file_path: SNIPPET_FILE_NAME,
      content: getModifiedList(list)
    }],
    visibility: 'public'
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const snippetResponse = response.data as SnippetResponse
  const id = snippetResponse.id.toString()
  setShareId(id)

  return id
}

export async function updateList (list: string): Promise<void> {
  const shareId = getShareId()
  if (!shareId) return Promise.resolve()
  const accessToken = getAccessToken()
  if (!accessToken) throw Error('Not logged in')
  await initGit(shareId)
  await resetToOldestCommit(fs)

  const dir = GITLAB_DIR
  const data = new TextEncoder().encode(getModifiedList(list))
  await writeFile(`${dir}/${SNIPPET_FILE_NAME}`, Buffer.from(data))
  await git.add({ fs, dir, filepath: SNIPPET_FILE_NAME })

  await git.commit({
    fs,
    dir,
    message: 'Update snippet',
    author: {
      name: 'Manga Reader'
    }
  })

  await git.push({
    fs,
    http,
    dir,
    force: true,
    onAuth: () => {
      return {
        username: 'oauth2',
        password: accessToken
      }
    }
  })
}

export function getNotifyOptions (error: unknown, urlNavigation: Ref<UrlNavigation | undefined>) {
  let description = JSON.stringify(error)

  if (error instanceof Error) {
    description = error.message
    if ('description' in error) {
      description = `Status code ${description}: ${JSON.stringify((error as { description: unknown }).description)}`
    }
  }

  const notifyOptions = new NotifyOptions(description, 'Failed to set share URL')
  notifyOptions.actions = [(
    {
      label: 'Visit',
      handler: () => {
        urlNavigation.value = new UrlNavigation('https://gitlab.com/dashboard', false)
      },
      color: 'white'
    }
  )]
  return notifyOptions
}

function getModifiedList (list: string) {
  // Add random numbers to prevent spam errors, this should only update once every 5 minutes.
  return Buffer.from(Math.random().toString() + list + Math.random().toString()).toString('base64')
}
