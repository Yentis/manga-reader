import { LocalStorage } from 'quasar'
import { Ref } from 'vue'
import { Gitlab } from '@gitbeaker/browser'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from '../classes/urlNavigation'
import constants from 'src/classes/constants'
import git from 'isomorphic-git'
import LightningFS, { FSConstructorOptions } from '@isomorphic-git/lightning-fs'
import http from 'isomorphic-git/http/web'

const CLIENT_ID = '1ac7147c66b40b6aaae3f3fd0cac5169d26fd4b406e6198f4b3fd1fd29d9816a'
const GITLAB_DIR = '/gitlab'
const SNIPPET_FILE_NAME = 'manga_list.json'

const fs = new LightningFS('fs', { wipe: true } as FSConstructorOptions)
let initialized = false

async function initGit (shareId: string) {
  if (initialized) return
  initialized = true

  await fs.promises.mkdir(GITLAB_DIR)
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

async function resetToOldestCommit (fs: LightningFS) {
  const dir = GITLAB_DIR
  const commits = await git.log({ fs, dir })
  if (commits.length <= 1) return

  const oldestCommit = commits[commits.length - 1].oid
  const data = new TextEncoder().encode(oldestCommit)
  const branch = await git.currentBranch({ fs, dir })
  if (typeof branch !== 'string') return

  await fs.promises.writeFile(`${dir}/.git/refs/heads/${branch}`, data)
  await git.resetIndex({ fs, dir, filepath: SNIPPET_FILE_NAME })
  await git.checkout({ fs, dir })
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

export function getAuthUrl () {
  return `https://gitlab.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost/redirect_gitlab&response_type=token&scope=api`
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

  const gitlab = new Gitlab({
    oauthToken: accessToken
  })

  const response = await gitlab.Snippets.create('My Manga List', SNIPPET_FILE_NAME, getModifiedList(list), 'public')
  const id = response.id as string
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
  await fs.promises.writeFile(`${dir}/${SNIPPET_FILE_NAME}`, data)
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
