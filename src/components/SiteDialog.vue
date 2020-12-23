<template>
  <q-dialog
      ref="dialog"
      no-focus
      no-refocus
      seamless
      :hidden="!visible || ($q.platform.is.mobile && searchResults.length !== 0)"
      :position="$q.platform.is.mobile ? 'bottom' : 'right'"
      @hide="onDialogHide">
      <q-card :class="{ 'mobile-site-dialog': $q.platform.is.mobile }">
        <q-toolbar class="bg-primary text-white text-center q-pl-xs">
            <q-btn
              flat
              round
              icon="refresh"
              :loading="refreshing"
              @click="onRefreshSites"
            />
            <q-toolbar-title class="q-pl-xs">Supported sites</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-pa-none">
            <q-list separator :class="{ 'text-center': $q.platform.is.mobile }">
              <q-item
                  clickable
                  v-for="item in siteList"
                  :key="item.site.siteType"
                  :class="{ 'bg-warning': !item.site.statusOK(), 'text-black': !item.site.statusOK() && $q.dark.isActive }"
                  @click="item.site.loggedIn ? item.site.statusOK() ? onLinkClicked(item.site.getUrl()) : onLinkClicked(item.site.getUrl(), true) : onLinkClicked(item.site.getLoginUrl(), true)">
                  <q-item-section v-if="!item.refreshing">
                    <q-item-label :class="{ 'full-width': $q.platform.is.mobile }">{{ siteNames[item.site.siteType] }}</q-item-label>
                    <q-item-label v-if="!item.site.loggedIn" :class="{ 'text-grey-8': $q.dark.isActive }" caption>Click to login</q-item-label>
                    <q-item-label v-else-if="!item.site.statusOK()" :class="{ 'text-grey-8': $q.dark.isActive }" caption>{{ item.site.state }}</q-item-label>
                  </q-item-section>

                  <q-inner-loading :showing="item.refreshing">
                    <q-spinner-dots size="md" color="primary" />
                  </q-inner-loading>
              </q-item>
            </q-list>
        </q-card-section>
      </q-card>
  </q-dialog>
</template>

<script lang="ts">
import pEachSeries from 'p-each-series'
import Vue, { VueConstructor } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import { BaseSite } from 'src/classes/sites/baseSite'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { getSiteMap } from 'src/services/siteService'
import { SiteName } from 'src/enums/siteEnum'

interface DisplayedSite {
   site: BaseSite
   refreshing: boolean
}

function siteSort (a: DisplayedSite, b: DisplayedSite): number {
  return a.site.compare(b.site)
}

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  props: {
    title: String,
    content: String,
    imageUrl: String
  },

  data () {
    return {
      visible: true,
      refreshing: false,
      siteList: [] as DisplayedSite[],
      siteNames: SiteName,
      windowSize: [] as Array<number>
    }
  },

  computed: {
    ...mapGetters('reader', {
      searchResults: 'searchResults'
    })
  },

  watch: {
    windowSize (value: Array<number>) {
      if (value[0] <= 700 && !this.$q.platform.is.mobile) this.visible = false
      else if (value[1] <= 500 && this.$q.platform.is.mobile) this.visible = false
      else this.visible = true
    }
  },

  mounted () {
    this.updateSiteList()
    this.windowSize = [window.innerWidth, window.innerHeight]

    this.$nextTick(() => {
      window.addEventListener('resize', () => {
        this.windowSize = [window.innerWidth, window.innerHeight]
      })
    })
  },

  methods: {
    ...mapMutations('reader', {
      pushUrlNavigation: 'pushUrlNavigation'
    }),

    updateSiteList () {
      this.siteList = Array.from(getSiteMap().values()).map(site => {
        return {
          site,
          refreshing: false
        }
      }).sort(siteSort)
    },

    show () {
      this.$refs.dialog.show()
    },

    hide () {
      this.$refs.dialog.hide()
    },

    onLinkClicked (url: string, openInApp = false) {
      this.pushUrlNavigation(new UrlNavigation(url, openInApp))
    },

    onDialogHide () {
      this.$emit('hide')
    },

    onOKClick () {
      this.$emit('ok')
      this.hide()
    },

    onCancelClick () {
      this.hide()
    },

    onRefreshSites () {
      this.refreshing = true
      this.siteList.forEach(item => {
        item.refreshing = true
      })

      const promises = [] as Promise<void>[]
      const siteMap = [] as BaseSite[]

      getSiteMap().forEach(site => {
        siteMap.push(site)
        promises.push(site.checkState())
      })
      pEachSeries(promises, (result, index) => {
        const site = siteMap[index]
        const siteItem = this.siteList.find(item => item.site.siteType === site.siteType)

        if (siteItem) {
          siteItem.site = site
          siteItem.refreshing = false
        }
      }).catch((error: Error) => {
        console.error(error)
      }).finally(() => {
        this.refreshing = false
        this.siteList.sort(siteSort)
      })
    }
  }
})
</script>

<style lang="scss" scoped>

.mobile-site-dialog {
  height: 25vh;
  min-height: 25vh;
}

</style>
