<template>
  <q-page class="q-ma-sm">
    <manga-header />

    <q-linear-progress
      v-if="refreshing"
      :indeterminate="refreshProgress === 0"
      :value="refreshProgress"
      instant-feedback
      size="xl"
      class="q-mt-sm"
    ></q-linear-progress>

    <div class="manga-container q-mt-sm full-width">
      <q-intersection
        v-for="manga in filteredMangaList"
        :key="manga.url"
        class="q-mb-sm full-width manga-item"
      >
        <manga-item :url="manga.url" />
      </q-intersection>
    </div>
  </q-page>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import moment from 'moment'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { SiteType } from 'src/enums/siteEnum'
import { checkUpdates, GithubRelease, getElectronAsset, getApkAsset } from 'src/services/updateService'
import { setAccessToken } from 'src/services/dropboxService'
import MangaHeader from 'src/components/Header.vue'
import MangaItem from 'src/components/MangaItem.vue'
import { Manga } from 'src/classes/manga'
import { Settings } from 'src/classes/settings'

export default defineComponent({
  components: {
    MangaHeader,
    MangaItem
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing',
      refreshProgress: 'refreshProgress',
      settings: 'settings'
    }),

    filteredMangaList () {
      const settings = this.settings as Settings
      return (this.mangaList as Manga[]).filter(manga => {
        return settings.filters.includes(manga.status)
      })
    }
  },

  methods: {
    ...mapMutations('reader', {
      pushNotification: 'pushNotification',
      pushUrlNavigation: 'pushUrlNavigation'
    }),

    showUpdateAvailable (githubRelease: GithubRelease) {
      const notifyOptions = new NotifyOptions(`Update available: ${githubRelease.tag_name}`)
      notifyOptions.type = 'positive'
      notifyOptions.position = 'bottom'
      notifyOptions.actions = [{
        label: 'Download',
        handler: () => {
          if (this.$q.platform.is.mobile) {
            const apkAsset = getApkAsset(githubRelease)
            if (!apkAsset) return
            window.location.href = apkAsset.browser_download_url
          } else {
            const electronAsset = getElectronAsset(githubRelease)
            if (!electronAsset) return
            this.pushUrlNavigation(new UrlNavigation(electronAsset.browser_download_url, false))
          }
        },
        color: 'white'
      }]

      this.pushNotification(notifyOptions)
    },

    doUpdateCheck () {
      checkUpdates().then(result => {
        if (result) {
          this.showUpdateAvailable(result)
        }
      }).catch(error => this.pushNotification(new NotifyOptions(error, 'Failed to check for updates')))
    }
  },

  mounted () {
    if (this.$q.platform.is.mobile) {
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'ageGatePass', 'true', () => undefined, (error) => console.error(error))
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'timezoneOffset', (moment().utcOffset() / 60).toString(), () => undefined, (error) => console.error(error))

      document.addEventListener('resume', () => {
        this.doUpdateCheck()
      })
    }

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('dropbox-token', (event, token) => {
        const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
        notifyOptions.type = 'positive'
        this.pushNotification(notifyOptions)
        setAccessToken(token)
      })
    }

    this.doUpdateCheck()
  }
})
</script>

<style lang="scss">

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

a {
  text-decoration: none;
  color: $primary;
}

.manga-container {
  display: inline-block;
}

.manga-item {
  min-height: 10rem;
}

</style>
