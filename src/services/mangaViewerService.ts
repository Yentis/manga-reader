import { SiteType } from '../enums/siteEnum'
import { requestHandler } from './requestService'
import { BiliBiliComics, BiliBiliComicsQueryData, ComicDetailResponse } from '../classes/sites/bilibilicomics'
import qs from 'qs'
import { ContentType } from 'src/enums/contentTypeEnum'

const COMIC_BILIBILICOMICS_API_URL = `${BiliBiliComics.getUrl()}/twirp/comic.v1.Comic`
const USER_BILIBILICOMICS_API_URL = 'https://us-user.bilibilicomics.com/twirp/global.v1.User'

export interface ChapterData {
  id: number,
  chapterNum: number,
  chapter: string
}

interface ImageData {
  id: number,
  images: string[]
}

interface CredentialData {
  data: {
    credential: string
  }
}

interface ImageIndexData {
  data: {
    host: string,
    images: { path: string }[],
  }
}

interface ImageTokenData {
  data: {
    token: string,
    url: string
  }[]
}

export async function getImagesFromData (type: string, data: string): Promise<ImageData | null> {
  if (type !== SiteType.BiliBiliComics) return null
  if (!data) return null

  const bilibiliComicsData = JSON.parse(data) as BiliBiliComicsQueryData
  if (bilibiliComicsData.id === undefined) return { id: -1, images: [] }
  if (bilibiliComicsData.chapter === undefined) return { id: -1, images: [] }

  const queryString = qs.stringify({
    device: 'pc',
    platform: 'web'
  })

  const credentialResponse = await requestHandler.sendRequest({
    method: 'POST',
    url: `${USER_BILIBILICOMICS_API_URL}/GetCredential?${queryString}`,
    data: `{"ep_id": ${bilibiliComicsData.chapter}, "comic_id": ${bilibiliComicsData.id}, "type": 1}`,
    headers: { 'Content-Type': ContentType.JSON }
  })
  const credentialData = JSON.parse(credentialResponse.data) as CredentialData

  const imageIndexResponse = await requestHandler.sendRequest({
    method: 'POST',
    url: `${COMIC_BILIBILICOMICS_API_URL}/GetImageIndex?${queryString}`,
    data: `{"ep_id": ${bilibiliComicsData.chapter}, "credential": ${credentialData.data.credential}}`,
    headers: { 'Content-Type': ContentType.JSON }
  })
  const imageIndexData = JSON.parse(imageIndexResponse.data) as ImageIndexData

  const imageTokenResponse = await requestHandler.sendRequest({
    method: 'POST',
    url: `${COMIC_BILIBILICOMICS_API_URL}/ImageToken?${queryString}`,
    data: `{"urls": "[${imageIndexData.data.images.map((image) => `\\"${image.path}\\"`).join(',')}]"}`,
    headers: { 'Content-Type': ContentType.JSON }
  })
  const imageTokenData = JSON.parse(imageTokenResponse.data) as ImageTokenData

  const images = imageTokenData.data.map((image) => {
    return `${image.url}?token=${image.token}`
  })

  return {
    id: bilibiliComicsData.chapter,
    images
  }
}

export async function getChaptersFromData (type: string, data: string): Promise<ChapterData[]> {
  if (type !== SiteType.BiliBiliComics) return []
  if (!data) return []

  const bilibiliComicsData = JSON.parse(data) as BiliBiliComicsQueryData
  if (bilibiliComicsData.id === undefined) return []

  const queryString = qs.stringify({
    device: 'pc',
    platform: 'web'
  })

  const response = await requestHandler.sendRequest({
    method: 'POST',
    url: `${COMIC_BILIBILICOMICS_API_URL}/ComicDetail?${queryString}`,
    data: `{"comic_id":"${bilibiliComicsData.id}"}`,
    headers: { 'Content-Type': ContentType.JSON }
  })

  const comicDetailResponse = JSON.parse(response.data) as ComicDetailResponse
  return comicDetailResponse.data.ep_list.map((chapter) => {
    return {
      id: chapter.id,
      chapterNum: chapter.ord,
      chapter: chapter.title
    }
  })
}
