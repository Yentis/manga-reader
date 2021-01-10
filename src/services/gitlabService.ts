import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { Gitlab } from '@gitbeaker/browser'

const CLIENT_ID = '1ac7147c66b40b6aaae3f3fd0cac5169d26fd4b406e6198f4b3fd1fd29d9816a'

let accessToken: string = LocalStorage.getItem(constants().GITLAB_TOKEN) || ''
let shareId: string = LocalStorage.getItem(constants().SHARE_ID) || ''

export function getAccessToken (): string {
  return accessToken
}

export function getShareId (): string {
  return shareId
}

export function setAccessToken (token: string | undefined) {
  if (!token) return

  accessToken = token
  LocalStorage.set(constants().GITLAB_TOKEN, token)
}

export function getAuthUrl () {
  return `https://gitlab.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost/redirect_gitlab&response_type=token&scope=api`
}

export function setShareId (id: string | undefined) {
  if (id === undefined) return

  shareId = id
  LocalStorage.set(constants().SHARE_ID, id)
}

export async function createList (list: string): Promise<string> {
  if (!accessToken) {
    throw Error('Not logged in')
  }

  const gitlab = new Gitlab({
    oauthToken: accessToken
  })

  const response = await gitlab.Snippets.create('My Manga List', 'manga_list.json', getModifiedList(list), 'public')
  const id = response.id as string
  setShareId(id)
  return id
}

export async function updateList (list: string): Promise<void> {
  if (!shareId) return Promise.resolve()
  if (!accessToken) throw Error('No login data found')

  const gitlab = new Gitlab({
    oauthToken: accessToken
  })

  await gitlab.Snippets.edit(parseInt(shareId), {
    files: [{
      action: 'update',
      file_path: 'manga_list.json',
      content: getModifiedList(list)
    }]
  })
}

function getModifiedList (list: string) {
  // Add random numbers to prevent spam errors, this should only update once every 5 minutes.
  return Buffer.from(Math.random().toString() + list + Math.random().toString()).toString('base64')
}
