<template>
    <div class="header">
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="primary" label="Add" @click="onAddManga" />
        <q-btn v-else class="q-mr-sm" color="primary" label="Add Manga" @click="onAddManga" />
        <q-btn v-if="$q.platform.is.mobile" color="secondary" label="Refresh" @click="onRefreshAllManga" />
        <q-btn v-else color="secondary" label="Refresh Manga" @click="onRefreshAllManga" />
      </div>
      <!--<div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="info" icon="backup" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-else class="q-mr-sm" color="info" label="Export to Dropbox" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-if="$q.platform.is.mobile" color="accent" icon="cloud_download" :loading="importing" :disable="exporting" @click="importList" />
        <q-btn v-else color="accent" label="Import from Dropbox" :loading="importing" :disable="exporting" @click="importList" />
      </div>
      <div class="flex-column-between">
        <q-checkbox v-model="openInBrowser" label="Open in browser" @input="saveOpenInBrowser" />
        <q-checkbox v-model="darkMode" label="Dark mode" @input="saveDarkMode" />
      </div>!-->
    </div>
</template>

<script lang="ts">
import { LocalStorage } from 'quasar'
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import pEachSeries from 'p-each-series'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo } from 'src/services/siteService'
import SearchDialog from './SearchDialog.vue'
import SiteDialog from './SiteDialog.vue'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { UpdateManga } from 'src/classes/updateManga'

export default defineComponent({
  name: 'manga-header',

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing',
      refreshProgress: 'refreshProgress'
    })
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      updateRefreshProgress: 'updateRefreshProgress',
      incrementRefreshProgress: 'incrementRefreshProgress',
      pushNotification: 'pushNotification',
      addManga: 'addManga',
      updateManga: 'updateManga',
      pushUrlNavigation: 'pushUrlNavigation'
    }),

    onAddManga () {
      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Add manga'
      }).onOk((data: { url: string }) => {
        this.onMangaSelected(data.url)
      }).onDismiss(() => {
        if (siteDialog) {
          siteDialog.hide()
        }
      })

      const siteDialog = this.$q.dialog({
        component: SiteDialog,
        parent: this
      })
    },

    onMangaSelected (url: string) {
      const site = Object.values(SiteType).find(site => url.includes(site))
      if (site === undefined) {
        this.pushNotification(new NotifyOptions(Error('Valid site not found')))
        return
      }

      this.updateRefreshing(true)
      getMangaInfo(url, site)
        .then(manga => {
          if (manga instanceof Error) {
            this.pushNotification(new NotifyOptions(manga))
          } else {
            manga.read = manga.chapter
            manga.readUrl = manga.chapterUrl
            this.onMangaRetrieved(manga)
          }
        })
        .catch(error => this.pushNotification(new NotifyOptions(error)))
        .finally(() => this.updateRefreshing(false))
    },

    onMangaRetrieved (manga: Manga) {
      for (const entry of this.mangaList as Manga[]) {
        if (entry.url === manga.url) {
          this.pushNotification(new NotifyOptions(Error('Manga already exists')))
          return
        }
      }

      this.addManga(manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      this.updateRefreshing(false)
    },

    onRefreshAllManga () {
      if (this.refreshing) return
      this.updateRefreshProgress(0.01)
      this.updateRefreshing(true)

      const promises = (this.mangaList as Manga[]).map(manga => getMangaInfo(manga.url, manga.site))
      const step = promises.length > 0 ? (1 / promises.length) : 0
      pEachSeries(promises, (result, index) => {
        const manga = (this.mangaList as Manga[])[index]

        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(`Failed to refresh ${manga.title}`)
          notifyOptions.caption = result.message
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              this.pushUrlNavigation(new UrlNavigation(manga.url, false))
            },
            color: 'white'
          }]

          this.pushNotification(notifyOptions)
        } else {
          const read = manga.read
          const readUrl = manga.readUrl
          const mangaDexId = manga.mangaDexId

          result.read = read
          result.readUrl = readUrl
          result.mangaDexId = mangaDexId

          this.updateManga(new UpdateManga(result, index))
        }

        this.incrementRefreshProgress(step)
      }).catch((error: Error) => {
        this.pushNotification(new NotifyOptions(error))
      }).finally(() => {
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        this.updateRefreshing(false)
        this.updateRefreshProgress(0)
      })
    }
  }
})
</script>

<style lang="scss">

.header {
  display: flex;
  justify-content: space-between;
}

</style>
