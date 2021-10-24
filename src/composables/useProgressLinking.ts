import { useQuasar } from 'quasar'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteType } from 'src/enums/siteEnum'
import { getSite } from 'src/services/siteService'
import { useStore } from 'src/store'
import useNotification from './useNotification'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import LinkingDialog from '../components/LinkingDialog.vue'
import { BaseSite } from 'src/classes/sites/baseSite'
import { getSiteNameByUrl } from 'src/utils/siteUtils'

export default function useProgressLinking (
  title: Ref<string>,
  linkedSites: Ref<Record<string, number>>,
  newLinkedSites: Ref<Record<string, number> | undefined>
) {
  const { notification } = useNotification()

  const $q = useQuasar()
  const $store = useStore()
  const linkSite = (url: string, siteType: SiteType | LinkingSiteType) => {
    if (url === '') return

    const site = getSite(siteType)
    if (!site) {
      notification.value = new NotifyOptions('Site not found')
      return
    }

    const failMessage = 'Failed to get manga from URL'
    site.getMangaId($q, $store, url).then(mangaId => {
      if (mangaId instanceof Error) {
        notification.value = new NotifyOptions(mangaId, failMessage)
        return
      }
      if (mangaId === -1) {
        notification.value = new NotifyOptions('No ID found in URL', failMessage)
        return
      }

      const curLinkedSites = newLinkedSites.value || {}
      curLinkedSites[siteType] = mangaId

      newLinkedSites.value = curLinkedSites
    }).catch(error => {
      notification.value = new NotifyOptions(error, failMessage)
    })
  }

  const openLinkingDialog = () => {
    $q.dialog({
      component: LinkingDialog,
      componentProps: {
        linkedSites: newLinkedSites.value || linkedSites.value,
        initialSearch: title.value,
        searchPlaceholder: 'Search for the manga',
        manualPlaceholder: 'Or enter the url manually',
        confirmButton: 'Select'
      }
    }).onOk((data: {
      url: string,
      siteType: SiteType | LinkingSiteType,
      linkedSites: Record<string, number>
    }) => {
      newLinkedSites.value = data.linkedSites
      linkSite(data.url, data.siteType)
    })
  }

  const saveLinkedSites = () => {
    if (newLinkedSites.value === undefined) return false

    linkedSites.value = newLinkedSites.value
    return true
  }

  const syncSites = (chapterNum: number) => {
    Object.keys(linkedSites.value).forEach(key => {
      const siteType = key as SiteType | LinkingSiteType
      const site = getSite(siteType)
      const mangaId = linkedSites.value[siteType]

      if (site && mangaId) {
        syncSite(site, mangaId, chapterNum)
      }
    })
  }

  const syncSite = (site: BaseSite, mangaId: number, chapterNum: number) => {
    site.syncReadChapter(mangaId, chapterNum).then((result) => {
      if (result instanceof Error) {
        showSyncError(result, site, mangaId, chapterNum)
        return
      }

      const notifyOptions = new NotifyOptions(`Synced with ${getSiteNameByUrl(site.siteType) || 'unknown site'}`)
      notifyOptions.type = 'positive'
      notification.value = notifyOptions
    }).catch(error => {
      showSyncError(error, site, mangaId, chapterNum)
    })
  }

  const showSyncError = (error: string | Error, site: BaseSite, mangaId: number, chapterNum: number) => {
    const notifyOptions = new NotifyOptions(error, `Failed to sync with ${getSiteNameByUrl(site.siteType) || 'unknown site'}`)

    notifyOptions.actions = [{
      label: 'Relog',
      handler: async () => {
        const loggedIn = await site.openLogin($q, $store)
        if (loggedIn instanceof Error) {
          notification.value = new NotifyOptions(loggedIn, 'Failed to log in')
        } else if (loggedIn === true) {
          syncSite(site, mangaId, chapterNum)
        }
      },
      color: 'white'
    }]

    notification.value = notifyOptions
  }

  return {
    linkSite,
    openLinkingDialog,
    saveLinkedSites,
    syncSites
  }
}
