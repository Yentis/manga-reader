import { BaseSite } from '../classes/sites/baseSite'
import { Ref, ref, onMounted } from 'vue'
import { getSiteMap } from '../services/siteService'
import pEachSeries from 'p-each-series'
import useInitialized from './useInitialized'

interface DisplayedSite {
  site: BaseSite
  refreshing: boolean
}

function siteSort (a: DisplayedSite, b: DisplayedSite): number {
  return a.site.compare(b.site)
}

export default function useSiteList () {
  const siteList: Ref<DisplayedSite[]> = ref([])
  const getSiteList = () => {
    siteList.value = Array.from(getSiteMap().values()).map(site => {
      return {
        site,
        refreshing: false
      }
    }).sort(siteSort)
  }

  onMounted(getSiteList)

  const refreshing = ref(false)
  const { siteState: siteStateInitialized } = useInitialized()

  const refreshSites = () => {
    refreshing.value = true
    siteList.value.forEach((site) => {
      site.refreshing = true
    })

    const promises: Promise<void>[] = []
    const siteMap: BaseSite[] = []

    getSiteMap().forEach(site => {
      siteMap.push(site)
      promises.push(site.checkState())
    })

    pEachSeries(promises, (_result, index) => {
      const site = siteMap[index]
      const siteItem = siteList.value.find(item => item.site.siteType === site.siteType)
      if (!siteItem) return

      siteItem.site = site
      siteItem.refreshing = false
    }).catch((error: Error) => {
      console.error(error)
    }).finally(() => {
      refreshing.value = false
      siteList.value.sort(siteSort)
    })
  }

  onMounted(() => {
    if (siteStateInitialized.value) return
    refreshSites()
    siteStateInitialized.value = true
  })

  return { siteList, refreshing, refreshSites }
}