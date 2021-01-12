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
import { SiteType } from 'src/enums/siteEnum'
import * as DropboxService from 'src/services/dropboxService'
import * as GitlabService from 'src/services/gitlabService'
import MangaHeader from 'src/components/Header.vue'
import MangaItem from 'src/components/MangaItem.vue'
import { Manga } from 'src/classes/manga'
import { Settings } from 'src/classes/settings'
import { InitializeComponents } from 'src/classes/initializeComponents'

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
      settings: 'settings',
      searchValue: 'searchValue',
      initialized: 'initialized'
    }),

    filteredMangaList () {
      const settings = this.settings as Settings
      return ((this.mangaList as unknown) as Manga[]).filter(manga => {
        return manga.title.toLowerCase().includes(((this.searchValue as unknown) as string).toLowerCase()) &&
               settings.filters.includes(manga.status)
      })
    }
  },

  methods: {
    ...mapMutations('reader', {
      pushNotification: 'pushNotification',
      pushUrlNavigation: 'pushUrlNavigation',
      updateInitialized: 'updateInitialized'
    })
  },

  mounted () {
    if (this.$q.platform.is.mobile) {
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'ageGatePass', 'true', () => undefined, (error) => console.error(error))
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'timezoneOffset', (moment().utcOffset() / 60).toString(), () => undefined, (error) => console.error(error))

      document.addEventListener('resume', () => {
        if ((this.initialized as InitializeComponents).main) {
          this.updateInitialized(new InitializeComponents())
        }
      })
    }

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('dropbox-token', (event, token) => {
        const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
        notifyOptions.type = 'positive'
        this.pushNotification(notifyOptions)
        DropboxService.setAccessToken(token)
      })

      this.$q.electron.ipcRenderer.on('gitlab-token', (event, token) => {
        const notifyOptions = new NotifyOptions('Logged in successfully!')
        notifyOptions.type = 'positive'
        this.pushNotification(notifyOptions)
        GitlabService.setAccessToken(token)

        this.$q.loading.show({
          delay: 100
        })
        GitlabService.createList(JSON.stringify(this.mangaList)).catch(error => {
          this.pushNotification(GitlabService.getNotifyOptions(this, error))
        }).finally(() => {
          this.$q.loading.hide()
        })
      })
    }
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
  min-height: 11rem;
}

</style>
