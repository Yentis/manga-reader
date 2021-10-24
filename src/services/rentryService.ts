import { LocalStorage } from 'quasar'
import constants from 'src/classes/constants'
import { requestHandler } from './requestService'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { UrlNavigation } from '../classes/urlNavigation'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { ContentType } from 'src/enums/contentTypeEnum'
import { getCookies } from 'src/classes/requests/baseRequest'

const URL = 'https://rentry.co'

interface RentryResponse {
  status: string,
  content: string,
  url: string,
  'edit_code': string
}

export function getShareId (): string {
  return LocalStorage.getItem(constants.SHARE_ID) || ''
}

export function setShareId (id?: string) {
  if (!id) return
  LocalStorage.set(constants.SHARE_ID, id)
}

export function getEditCode (): string {
  return LocalStorage.getItem(constants.SHARE_EDIT_CODE) || ''
}

export function setEditCode (code?: string) {
  if (!code) return
  LocalStorage.set(constants.SHARE_EDIT_CODE, code)
}

export async function getCsrfToken (): Promise<string> {
  const response = await requestHandler.sendRequest({
    method: 'GET',
    url: URL
  })

  const cookies = getCookies(response)
  if (!cookies.csrftoken) {
    throw Error('CSRF token was not found')
  }

  return cookies.csrftoken
}

export async function createList (list: string, url?: string): Promise<string> {
  const shareId = getShareId()
  const editCode = getEditCode()
  if (shareId && editCode) {
    return Promise.resolve(shareId)
  }

  const csrfToken = await getCsrfToken()
  const response = await requestHandler.sendRequest({
    method: 'POST',
    data: JSON.stringify({
      csrfmiddlewaretoken: csrfToken,
      text: list,
      url
    }),
    url: `${URL}/api/new`,
    headers: {
      Referer: URL,
      'Content-Type': ContentType.URLENCODED,
      cookie: `csrftoken=${csrfToken}`
    }
  })

  const data = JSON.parse(response.data) as RentryResponse
  if (data.status !== '200') {
    throw Error(`Response status: ${data.status} with message: ${data.content}`)
  }

  const split = data.url.split('/')
  const id = split[split.length - 1]
  if (!id) {
    throw Error(`Could not parse response url: ${data.url}`)
  }

  setShareId(id)
  setEditCode(data.edit_code)

  return id
}

export async function updateList (list: string): Promise<void> {
  const shareId = getShareId()
  if (!shareId) return Promise.resolve()

  const editCode = getEditCode()
  if (!editCode) {
    await createList(list, shareId)
    return
  }

  const csrfToken = await getCsrfToken()
  await requestHandler.sendRequest({
    method: 'POST',
    data: JSON.stringify({
      csrfmiddlewaretoken: csrfToken,
      text: list,
      edit_code: editCode
    }),
    url: `${URL}/api/edit/${shareId}`,
    headers: {
      Referer: URL,
      'Content-Type': ContentType.URLENCODED,
      cookie: `csrftoken=${csrfToken}`
    }
  })
}

export function getNotifyOptions (error: unknown, urlNavigation: Ref<UrlNavigation | undefined>) {
  let description = JSON.stringify(error)
  if (error instanceof Error) {
    description = error.message
  }

  const notifyOptions = new NotifyOptions(description, 'Failed to set share URL')
  notifyOptions.actions = [(
    {
      label: 'Visit',
      handler: () => {
        urlNavigation.value = new UrlNavigation(URL, false)
      },
      color: 'white'
    }
  )]
  return notifyOptions
}
