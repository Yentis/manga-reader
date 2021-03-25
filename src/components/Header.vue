<template>
  <div>
    <div :class="{ 'header': true, 'q-mb-sm': mobileView }">
      <div :class="{ 'flex-column-between': mobileView, 'q-gutter-sm': mobileView }">
        <q-btn
          v-if="mobileView"
          color="primary"
          label="Add"
          @click="onAddManga"
        />
        <q-btn
          v-else
          class="q-mr-sm"
          color="primary"
          label="Add Manga"
          @click="onAddManga"
        />
        <q-btn
          v-if="mobileView"
          color="secondary"
          label="Refresh"
          @click="onRefreshAllManga"
        />
        <q-btn
          v-else
          color="secondary"
          label="Refresh Manga"
          @click="onRefreshAllManga"
        />
      </div>
      <div :class="{ 'flex-column-between': mobileView, 'q-gutter-sm': mobileView }">
        <q-btn
          v-if="mobileView"
          color="info"
          icon="backup"
          :loading="exporting"
          :disable="importing"
          @click="onExportList"
        />
        <q-btn
          v-else
          class="q-mr-sm"
          color="info"
          label="Export to Dropbox"
          :loading="exporting"
          :disable="importing"
          @click="onExportList"
        />
        <q-btn
          v-if="mobileView"
          color="accent"
          icon="cloud_download"
          :loading="importing"
          :disable="exporting"
          @click="onImportList"
        />
        <q-btn
          v-else
          color="accent"
          label="Import from Dropbox"
          :loading="importing"
          :disable="exporting"
          @click="onImportList"
        />
      </div>
      <q-btn
        flat
        round
        icon="settings"
        @click="onSettingsClick"
      />
    </div>

    <div>
      <q-input
        v-model="newSearch"
        dense
        outlined
        class="q-mb-sm full-width"
        @input="updateSearchValue(newSearch)"
      >
        <template v-slot:append>
          <q-icon
            v-if="newSearch === ''"
            name="search"
          />
          <q-icon
            v-else
            name="clear"
            class="cursor-pointer"
            @click="newSearch = ''; updateSearchValue(newSearch)"
          />
        </template>
      </q-input>

      <q-btn-dropdown
        no-caps
        class="q-mr-sm"
        :label="'Sort by: ' + settings.sortedBy"
      >
        <q-list
          v-for="type in sortTypes"
          :key="type"
        >
          <q-item
            v-close-popup
            clickable
            @click="updateSortedBy(type)"
          >
            <q-item-section>
              <q-item-label>{{ type }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn-dropdown
        no-caps
        label="Filters"
        @input="updateFilters"
      >
        <q-option-group
          v-model="newFilters"
          class="q-mr-sm"
          type="checkbox"
          :options="statusList"
        />
      </q-btn-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { LocalStorage } from 'quasar'
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import pEachSeries from 'p-each-series'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { Manga } from 'src/classes/manga'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { SiteType } from 'src/enums/siteEnum'
import { Status } from 'src/enums/statusEnum'
import { SortType } from 'src/enums/sortingEnum'
import { getMangaInfo } from 'src/services/siteService'
import { saveList, readList, getAuthUrl, setAccessToken, getAccessToken, cordovaLogin } from 'src/services/dropboxService'
import SearchDialog from './SearchDialog.vue'
import SiteDialog from './SiteDialog.vue'
import ConfirmationDialog from './ConfirmationDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import { Settings } from 'src/classes/settings'
import { RefreshOptions } from 'src/classes/refreshOptions'

interface CordovaNotificationOptions {
  title: string
  text: string
  icon: string
  smallIcon: string
  foreground: boolean
}

interface CordovaNotification {
  notification: {
    local: {
      schedule: (options: CordovaNotificationOptions) => void
    }
  }
}

export default defineComponent({
  name: 'manga-header',

  data () {
    return {
      exporting: false,
      importing: false,
      autoRefreshing: false,
      refreshInterval: undefined as NodeJS.Timeout | undefined,
      sortTypes: SortType,
      status: Status,
      newFilters: [] as Array<Status>,
      newSearch: ''
    }
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing',
      refreshProgress: 'refreshProgress',
      mobileView: 'mobileView',
      settings: 'settings'
    }),

    statusList () {
      return Object.values(Status).map(value => {
        return {
          label: value,
          value: value
        }
      })
    }
  },

  watch: {
    settings (settings: Settings) {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = undefined
      }

      this.createRefreshInterval(settings.refreshOptions)
    }
  },

  mounted () {
    this.newFilters = (this.settings as Settings).filters
    this.createRefreshInterval((this.settings as Settings).refreshOptions)
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      updateRefreshProgress: 'updateRefreshProgress',
      incrementRefreshProgress: 'incrementRefreshProgress',
      pushNotification: 'pushNotification',
      updateMangaList: 'updateMangaList',
      addManga: 'addManga',
      updateManga: 'updateManga',
      pushUrlNavigation: 'pushUrlNavigation',
      updateSettings: 'updateSettings',
      updateSearchValue: 'updateSearchValue'
    }),

    createRefreshInterval (refreshOptions: RefreshOptions) {
      this.refreshInterval = setInterval(() => {
        if (!refreshOptions.enabled || this.refreshing) return
        this.autoRefreshing = true
        this.onRefreshAllManga()
      }, refreshOptions.period * 60 * 1000)
    },

    onAddManga () {
      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Add manga',
        searchPlaceholder: 'Search for a manga',
        manualPlaceholder: 'Or enter a manga url manually',
        confirmButton: 'Add'
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
            manga.read = '0'
            manga.readNum = 0
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

      const filteredMangaList = (this.mangaList as Manga[]).filter(manga => manga.status === (undefined || Status.READING))
      const promises = filteredMangaList.map(manga => getMangaInfo(manga.url, manga.site, manga.altSources))
      const step = promises.length > 0 ? (1 / promises.length) : 0
      pEachSeries(promises, (result, index) => {
        const manga = filteredMangaList[index]

        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(result, `Failed to refresh ${manga.title}`)
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              this.pushUrlNavigation(new UrlNavigation(manga.url, true))
            },
            color: 'white'
          }]

          this.pushNotification(notifyOptions)
        } else {
          if (this.autoRefreshing && manga.chapter !== result.chapter) {
            this.sendPushNotification(result)
          }

          manga.title = result.title
          manga.chapter = result.chapter
          manga.chapterUrl = result.chapterUrl
          manga.chapterNum = result.chapterNum
          manga.chapterDate = result.chapterDate
          manga.image = result.image

          this.updateManga(manga)
        }

        this.incrementRefreshProgress(step)
      }).catch((error: Error) => {
        this.pushNotification(new NotifyOptions(error))
      }).finally(() => {
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        this.autoRefreshing = false
        this.updateRefreshing(false)
        this.updateRefreshProgress(0)
      })
    },

    onImportList () {
      if (!getAccessToken()) {
        this.startDropboxLogin()
      } else {
        this.importing = true

        readList().then(mangaList => {
          this.$q.dialog({
            component: ConfirmationDialog,
            title: 'Import from Dropbox',
            content: `Are you sure you want to import ${mangaList.length} titles from Dropbox?\nYou currently have ${(this.mangaList as Manga[]).length} titles.`
          }).onOk(() => {
            const notifyOptions = new NotifyOptions('Imported!')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
            this.updateMangaList(mangaList)
            LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
          })
        }).catch((error: Error) => {
          if (error.message === 'Unauthorized') {
            this.startDropboxLogin()
          } else {
            this.pushNotification(new NotifyOptions(error))
          }
        }).finally(() => {
          this.importing = false
        })
      }
    },

    onExportList () {
      if (!getAccessToken()) {
        this.startDropboxLogin()
      } else {
        this.$q.dialog({
          component: ConfirmationDialog,
          title: 'Export to Dropbox',
          content: `Are you sure you want to export ${(this.mangaList as Manga[]).length} titles to Dropbox?`
        }).onOk(() => {
          this.exporting = true

          saveList(this.mangaList).then(() => {
            const notifyOptions = new NotifyOptions('Exported!')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
          }).catch((error: Error) => {
            if (error.message === 'Unauthorized') {
              this.startDropboxLogin()
            } else {
              this.pushNotification(new NotifyOptions(error))
            }
          }).finally(() => {
            this.exporting = false
          })
        })
      }
    },

    onSettingsClick () {
      this.$q.dialog({
        component: SettingsDialog,
        parent: this
      })
    },

    startDropboxLogin () {
      if (this.$q.platform.is.mobile) {
        cordovaLogin()
          .then(token => {
            const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
            setAccessToken(token)
          })
          .catch(error => this.pushNotification(new NotifyOptions(error)))
      } else {
        this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
      }
    },

    sendPushNotification (manga: Manga) {
      if (this.$q.platform.is.electron) {
        const notification = new Notification(manga.title, {
          body: manga.chapter,
          icon: manga.image
        })

        notification.onclick = () => {
          this.pushUrlNavigation(new UrlNavigation(manga.url, false))
        }
      } else if (this.$q.platform.is.mobile) {
        (this.$q.cordova.plugins as CordovaNotification).notification.local.schedule({
          title: manga.title,
          text: manga.chapter,
          smallIcon: 'res://notification_icon',
          icon: manga.image,
          foreground: true
        })
      }
    },

    updateSortedBy (sortType: SortType) {
      const newSettings = Settings.clone(this.settings as Settings)
      newSettings.sortedBy = sortType

      this.updateSettings(newSettings)
    },

    updateFilters (showing: boolean) {
      if (showing) return
      const newSettings = Settings.clone(this.settings as Settings)
      newSettings.filters = this.newFilters

      this.updateSettings(newSettings)
    }
  }
})
</script>

<style lang="scss" scoped>

.header {
  display: flex;
  justify-content: space-between;
}

.flex-column-between button {
  width: 100%;
}

</style>
