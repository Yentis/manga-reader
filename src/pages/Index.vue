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
      <q-intersection once class="q-mb-sm full-width" v-for="(manga, index) in sortedMangaList" :key="manga.url">
        <q-card :class="{ 'card-container': manga.chapter !== manga.read }">
          <q-card-section horizontal>
            <q-img contain class="manga-image q-ma-sm" :src="manga.image">
              <template v-slot:error>
                <div class="error-image bg-negative">
                  <q-icon class="full-width full-height" size="xl" name="image_not_supported"></q-icon>
                </div>
              </template>
            </q-img>

            <q-card-section class="q-pb-none flex-column-between">
              <div class="q-mb-sm">
                <div class="text-h6">
                  <a :href="manga.url" @click.prevent="onLinkClick(manga.url)">{{ manga.title }}</a>
                </div>
                <div class="text-body2">
                  Read:&nbsp;&nbsp;&nbsp;&nbsp; <a v-if="manga.readUrl" :href="manga.readUrl" @click.prevent="onLinkClick(manga.readUrl || '#')">{{ manga.read }}</a>
                  <span v-else>{{ manga.read }}</span>
                </div>
                <div class="text-body2">
                  Current: <a v-if="manga.chapterUrl" :href="manga.chapterUrl" @click.prevent="onLinkClick(manga.chapterUrl)">{{ manga.chapter }}</a>
                  <span v-else>{{ manga.chapter }}</span>
                </div>
                <div class="text-body2" v-if="manga.chapterDate">
                  {{ manga.chapterDate }}
                </div>
              </div>
              <div class="text-subtitle1">
                {{ siteNames[manga.site] }}
              </div>
            </q-card-section>

            <q-space />

            <q-card-actions vertical>
              <q-space />

              <q-btn v-if="$q.platform.is.mobile && !manga.mangaDexId" color="info" icon="link" @click="onLinkClicked(index)" />
              <q-btn v-else-if="!manga.mangaDexId" color="info" label="Link with MangaDex" @click="onLinkClicked(index)" />
            </q-card-actions>

            <q-card-actions vertical>
              <q-btn
                flat
                icon="close"
                @click="onDeleteClick(index)" />

              <q-space />

              <q-btn
                v-if="manga.chapter !== manga.read"
                color="secondary"
                icon="done"
                @click="onReadClick(index)" />
            </q-card-actions>
          </q-card-section>
        </q-card>
      </q-intersection>
    </div>
  </q-page>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import { LocalStorage } from 'quasar'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UpdateManga } from 'src/classes/updateManga'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { SiteType, SiteName } from 'src/enums/siteEnum'
import { syncReadChapter } from 'src/services/siteService'
import { checkUpdates, GithubRelease, getElectronAsset, getApkAsset } from 'src/services/updateService'
import { setAccessToken } from 'src/services/dropboxService'
import MangaHeader from 'src/components/Header.vue'
import CustomDialog from 'src/components/CustomDialog.vue'
import SearchDialog from 'src/components/SearchDialog.vue'

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title > b.title ? 1 : -1
  } else {
    return b.chapter !== b.read ? 1 : -1
  }
}

export default defineComponent({
  data () {
    return {
      notificationShown: true,
      notificationText: '',
      siteNames: SiteName,
      siteTypes: SiteType,
      pendingMangaDexIndex: -1
    }
  },

  components: {
    MangaHeader
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing',
      refreshProgress: 'refreshProgress'
    }),
    sortedMangaList: function (): Manga[] {
      return (this.mangaList as Manga[]).sort(mangaSort)
    }
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      pushNotification: 'pushNotification',
      removeManga: 'removeManga',
      updateManga: 'updateManga',
      pushUrlNavigation: 'pushUrlNavigation'
    }),

    resetState () {
      this.updateRefreshing(false)
      this.$q.loading.hide()
    },

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
            this.onLinkClick(electronAsset.browser_download_url)
          }
        },
        color: 'white'
      }]

      this.showNotification(notifyOptions)
    },
    showNotification (notifyOptions: NotifyOptions) {
      this.resetState()
      this.pushNotification(notifyOptions)
    },
    onLinkClick (url: string, openInApp = false) {
      this.pushUrlNavigation(new UrlNavigation(url, openInApp))
    },
    onReadClick (index: number) {
      const manga = (this.mangaList as Manga[])[index]
      manga.read = manga.chapter
      manga.readUrl = manga.chapterUrl

      if (manga.mangaDexId) {
        syncReadChapter(manga.mangaDexId, manga.chapterNum).then(() => {
          const notifyOptions = new NotifyOptions('Synced with MangaDex')
          notifyOptions.type = 'positive'
          this.showNotification(notifyOptions)
        }).catch(error => {
          console.error(error)
          this.showNotification(new NotifyOptions(Error('Failed to sync with MangaDex')))
        })
      }

      this.updateManga(new UpdateManga(manga, index))
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
    },

    onDeleteClick (index: number) {
      const manga = (this.mangaList as Manga[])[index]

      this.$q.dialog({
        component: CustomDialog,
        title: 'Delete manga',
        content: `Are you sure you want to delete ${manga.title}?`,
        imageUrl: manga.image
      }).onOk(() => {
        this.removeManga(index)
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      })
    },

    onLinkClicked (index: number) {
      this.pendingMangaDexIndex = index

      const manga = (this.mangaList as Manga[])[index]

      if (manga.site === SiteType.MangaDex) {
        this.linkMangaDex(manga.url)
        return
      }

      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Select manga',
        initialSearch: manga.title,
        searchPlaceholder: 'Search for the manga',
        manualPlaceholder: 'Or enter the url manually',
        siteType: SiteType.MangaDex,
        confirmButton: 'Select'
      }).onOk((data: { url: string }) => {
        this.linkMangaDex(data.url)
      })
    },
    linkMangaDex (url: string) {
      if (this.pendingMangaDexIndex === -1) return
      if (url === '') return

      const manga = (this.mangaList as Manga[])[this.pendingMangaDexIndex]
      const matches = /\/title\/(\d*)\//gm.exec(url) || []
      let mangaId = -1

      for (const match of matches) {
        const parsedMatch = parseInt(match)
        if (!isNaN(parsedMatch)) mangaId = parsedMatch
      }

      if (mangaId !== -1) {
        manga.mangaDexId = mangaId

        this.updateManga(new UpdateManga(manga, this.pendingMangaDexIndex))
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      }

      this.pendingMangaDexIndex = -1
    }
  },
  mounted () {
    if (this.$q.platform.is.mobile) {
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'ageGatePass', 'true', () => undefined, (error) => console.error(error))
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'timezoneOffset', (moment().utcOffset() / 60).toString(), () => undefined, (error) => console.error(error))
    }

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('dropbox-token', (event, token) => {
        const notifyOptions = new NotifyOptions('Logged in successfully!')
        notifyOptions.type = 'positive'
        this.showNotification(notifyOptions)
        setAccessToken(token)
      })
    }

    checkUpdates().then(result => {
      if (result) {
        this.showUpdateAvailable(result)
      }
    }).catch(error => this.showNotification(new NotifyOptions(error)))
  }
})
</script>

<style lang="scss">

.body--light {
  .card-container {
    background-color: $grey-4;
  }
}

.body--dark {
  .card-container {
    background-color: $grey-9;
  }
}

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.flex-column-between button {
  width: 100%;
}

a {
  text-decoration: none;
  color: $primary;
}

.manga-container {
  display: inline-block;
}

.card-container a {
  color: $secondary;
}

.manga-image {
  min-width: 96px;
  width: 96px;
}

.error-image {
  min-width: 96px;
  min-height: 96px;
  width: 96px;
  height: 96px;
}

</style>
