import { LocalStorage } from 'quasar'
import { QVueGlobals } from 'quasar/dist/types'
import constants from 'src/classes/constants'
import { Manga } from 'src/classes/manga'
import { Kitsu } from 'src/classes/sites/kitsu'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { useStore } from 'src/store'
import { getSite, searchManga } from '../siteService'
import { searchValid } from '../testService'

const TARGET_LIBRARY_ID = 75449272
const TARGET_MANGA_ID = '40927'
const QUERY = 'yancha gal no anjou-san'
const SITE_TYPE = LinkingSiteType.Kitsu

export async function testKitsu ($q: QVueGlobals): Promise<void> {
  const site = getSite(LinkingSiteType.Kitsu) as Kitsu | undefined
  if (site === undefined) throw Error('Site not found')

  await testLogin(site)
  await testUserId(site)
  await testGetMangaId(site, $q)
  await testSyncReadChapter(site)
  await testSearch()
}

async function testLogin (site: Kitsu) {
  site.token = ''
  LocalStorage.remove(constants.KITSU_TOKEN)

  let loggedIn = await site.checkLogin()
  if (loggedIn) throw Error('Check login should return false')

  const username = process.env.KITSU_TEST_USERNAME
  if (username === undefined) throw Error('Username environment variable not set')
  const password = process.env.KITSU_TEST_PASSWORD
  if (password === undefined) throw Error('Password environment variable not set')

  const loginResponse = await site.doLogin({
    username,
    password
  })
  if (loginResponse instanceof Error) throw loginResponse
  if (loginResponse.access_token === '') throw Error('No access token received')

  loggedIn = await site.checkLogin()
  if (!loggedIn) throw Error('Check login should return true')

  const tokenStored = LocalStorage.getItem(constants.KITSU_TOKEN)
  if (tokenStored === null || tokenStored === '') throw Error('Token should be set in local storage')
}

async function testUserId (site: Kitsu) {
  const userId = await site.getUserId()
  if (userId instanceof Error) throw userId

  const targetUserId = process.env.KITSU_TEST_USER_ID
  if (targetUserId === undefined) throw Error('User ID environment variable not set')

  if (userId !== targetUserId) throw Error(`User ID should be ${targetUserId} but was ${userId}`)
}

async function testGetMangaId (site: Kitsu, $q: QVueGlobals) {
  const store = useStore()

  let libraryId = await site.getMangaId($q, store, 'https://kitsu.io/manga/yancha-gal-no-anjou-san')
  if (libraryId instanceof Error) throw libraryId
  if (libraryId !== TARGET_LIBRARY_ID) throw Error(`Library ID was not ${TARGET_LIBRARY_ID} for regular manga URL: ${libraryId}`)

  libraryId = await site.getMangaId($q, store, `https://kitsu.io/api/edge/library-entries/${TARGET_LIBRARY_ID}`)
  if (libraryId instanceof Error) throw libraryId
  if (libraryId !== TARGET_LIBRARY_ID) throw Error(`Library ID was not ${TARGET_LIBRARY_ID} for library entry URL: ${libraryId}`)
}

async function testSyncReadChapter (site: Kitsu) {
  const userId = await site.getUserId()
  if (userId instanceof Error) throw userId

  let libraryInfo = await site.getLibraryInfo(TARGET_MANGA_ID, userId)
  if (libraryInfo instanceof Error) throw libraryInfo

  const initialProgress = libraryInfo.attributes.progress
  const targetProgress = initialProgress < 100 ? initialProgress + 1 : initialProgress - 1

  const result = await site.syncReadChapter(TARGET_LIBRARY_ID, targetProgress)
  if (result instanceof Error) throw result

  libraryInfo = await site.getLibraryInfo(TARGET_MANGA_ID, userId)
  if (libraryInfo instanceof Error) throw libraryInfo
  if (libraryInfo.attributes.progress !== targetProgress) {
    throw Error(`Manga did not have progress of ${targetProgress}: ${libraryInfo.attributes.progress}`)
  }
}

async function testSearch () {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga('https://kitsu.io/manga/yancha-gal-no-anjou-san', SITE_TYPE)
  desired.image = 'https://media.kitsu.io/manga/poster_images/40927/small.jpg'
  desired.url = `https://kitsu.io/api/edge/library-entries/${TARGET_LIBRARY_ID}`

  return searchValid(results, desired, QUERY)
}
