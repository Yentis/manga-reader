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
      <q-toolbar class="bg-primary text-white text-center">
          <q-toolbar-title>Supported sites</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-pa-none">
          <q-list separator :class="{ 'text-center': $q.platform.is.mobile }">
          <q-item
              clickable
              v-for="site in siteMap"
              :key="site.siteType"
              :class="{ 'bg-warning': !site.statusOK(), 'text-black': !site.statusOK() && $q.dark.isActive }"
              @click="site.loggedIn ? site.statusOK() ? onLinkClicked(site.getUrl()) : onLinkClicked(site.getUrl(), true) : onLinkClicked(site.getLoginUrl(), true)">
              <q-item-section>
              <q-item-label :class="{ 'full-width': $q.platform.is.mobile }">{{ siteNames[site.siteType] }}</q-item-label>
              <q-item-label v-if="!site.loggedIn" :class="{ 'text-grey-8': $q.dark.isActive }" caption>Click to login</q-item-label>
              <q-item-label v-else-if="!site.statusOK()" :class="{ 'text-grey-8': $q.dark.isActive }" caption>{{ site.state }}</q-item-label>
              </q-item-section>
          </q-item>
          </q-list>
      </q-card-section>
      </q-card>
  </q-dialog>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import { BaseSite } from 'src/classes/sites/baseSite'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { getSiteMap } from 'src/services/siteService'
import { SiteName } from 'src/enums/siteEnum'

function siteSort (a: BaseSite, b: BaseSite): number {
  return a.compare(b)
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
      siteMap: [] as BaseSite[],
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
    this.siteMap = Array.from(getSiteMap().values()).sort(siteSort)
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
