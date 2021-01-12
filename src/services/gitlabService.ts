import { LocalStorage } from 'quasar'
import constants from 'src/boot/constants'
import { Gitlab } from '@gitbeaker/browser'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { ComponentRenderProxy } from '@vue/composition-api'
import { UrlNavigation } from 'src/classes/urlNavigation'

const CLIENT_ID = '1ac7147c66b40b6aaae3f3fd0cac5169d26fd4b406e6198f4b3fd1fd29d9816a'

let accessToken: string = LocalStorage.getItem(constants().GITLAB_TOKEN) || ''

export function getAccessToken (): string {
  return accessToken
}

export function getShareId (): string {
  return LocalStorage.getItem(constants().SHARE_ID) || ''
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
  LocalStorage.set(constants().SHARE_ID, id)
}

export async function createList (list: string): Promise<string> {
  const shareId = getShareId()
  if (shareId) {
    return Promise.resolve(shareId)
  }
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
  const shareId = getShareId()
  if (!shareId) return Promise.resolve()
  if (!accessToken) throw Error('Not logged in')

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

export function getNotifyOptions (componentRenderProxy: ComponentRenderProxy, error: unknown) {
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
        componentRenderProxy.$store.commit('reader/pushUrlNavigation', new UrlNavigation('https://gitlab.com/dashboard', false))
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
