<template>
  <q-card :class="{
    'completed-container': manga.status === status.COMPLETED,
    'on-hold-container': manga.status === status.ON_HOLD,
    'plan-to-read-container': manga.status === status.PLAN_TO_READ,
    'dropped-container': manga.status === status.DROPPED,
    'unread-container': ((manga.status === undefined || status.READING) && manga.chapter !== manga.read && (manga.readNum === undefined || manga.chapterNum !== manga.readNum))
  }">
    <q-card-section class="manga-item" horizontal>
      <q-img contain class="manga-image q-ma-sm" :src="image" @error="onImageError($event.target.src)">
        <template v-slot:error>
          <q-icon class="full-width full-height" size="xl" name="image_not_supported"></q-icon>
        </template>
      </q-img>

      <q-card-section class="q-pb-none q-pl-sm q-pr-none flex-column-between">
        <div class="q-mb-sm">
          <div :class="{ 'text-subtitle2': mobileView, 'text-h6': !mobileView }">
            <a :href="manga.url" @click.prevent="onLinkClick(manga.url)">{{ manga.title }}</a>
          </div>

          <div v-if="!editing">
            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Read:&nbsp;&nbsp;&nbsp;&nbsp; <a v-if="manga.readUrl" :href="manga.readUrl" @click.prevent="onLinkClick(manga.readUrl || '#')">{{ manga.read }}</a>
              <span v-else>{{ manga.read }}</span>
            </div>

            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Current: <a v-if="manga.chapterUrl" :href="manga.chapterUrl" @click.prevent="onLinkClick(manga.chapterUrl)">{{ manga.chapter }}</a>
              <span v-else>{{ manga.chapter }}</span>
            </div>

            <div v-if="manga.notes" :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Notes:&nbsp;&nbsp; <span>{{ manga.notes }}</span>
            </div>

            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView }" v-if="manga.chapterDate">
              {{ manga.chapterDate }}
            </div>

            <q-rating
              v-if="manga.rating"
              v-model="manga.rating"
              readonly
              size="1em"
              class="q-mt-sm"
              :max="10"
              :color="manga.rating > 6 ? 'positive' : manga.rating > 3 ? 'warning' : 'negative'"
            />
          </div>

          <q-card-actions class="q-pa-none" align="left" vertical v-else>
            <q-input v-model="newReadNum" label="Read:" stack-label dense class="q-mb-sm" />

            <q-input stack-label v-model="newNotes" label="Notes:" class="q-mb-sm" />

            <q-btn-dropdown
              no-caps
              class="q-mb-xs"
              :size="itemSize"
              :label="newStatus"
            >
              <q-list
                v-for="status in Object.values(status)"
                :key="status"
              >
                <q-item
                  clickable
                  v-close-popup
                  @click="newStatus = status"
                >
                  <q-icon
                    size="sm"
                    class="q-mr-sm vertical-center"
                    :name="statusIcon[status]"
                  />
                  <span class="full-width vertical-center text-center">{{ status }}</span>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-btn-dropdown
              no-caps
              :label="'Rating: ' + newRating"
              :size="itemSize"
            >
              <q-list v-for="index in 10" :key="index">
                <q-item
                  dense
                  clickable
                  v-close-popup
                  @click="newRating = index"
                >
                  <q-item-section>
                    <q-item-label>{{ index }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-btn
              no-caps
              v-if="editing"
              label="Progress Linking"
              :size="itemSize"
              @click="onLinkingClicked()"
            />
          </q-card-actions>
        </div>

        <div v-if="!editing" :class="{ 'text-caption': mobileView, 'text-body2': !mobileView }">
          <q-icon
            class="q-mr-xs q-mb-xs"
            :name="statusIcon[manga.status]"
            size="xs"
          />
          <span>{{ siteNames[manga.site] }}</span>
          <q-icon
            class="q-ml-xs"
            :name="hasLinkedSites ? 'link' : 'link_off'"
            :color="hasLinkedSites ? 'positive' : 'negative'"
          />
          <span
            class="q-ml-xs"
            v-for="(id, site) in linkedSites"
            :key="site"
          >
            <q-img
              class="q-ma-none q-pa-none"
              height="1rem"
              width="1rem"
              :src="'https://' + site + '/favicon.ico'"
            >
              <template v-slot:error>
                <q-icon class="absolute-full full-height full-width" name="image_not_supported"></q-icon>
              </template>
            </q-img>
          </span>
        </div>
      </q-card-section>

      <q-space />

      <q-card-actions class="q-pl-none" vertical>
        <q-btn
          flat
          icon="close"
          :size="itemSize"
          @click="editing ? onToggleEditing() : onDeleteClick()" />

        <q-btn
          flat
          icon="edit"
          v-if="!editing"
          :size="itemSize"
          @click="onToggleEditing()" />
        <q-btn
          flat
          icon="save"
          v-else
          :size="itemSize"
          @click="onSaveEdit()" />

        <q-space />

        <q-btn
          v-if="manga.chapter !== manga.read"
          color="secondary"
          icon="done"
          :size="itemSize"
          @click="onReadClick()" />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import { LocalStorage } from 'quasar'
import { Manga } from 'src/classes/manga'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { getSite } from 'src/services/siteService'
import LinkingDialog from './LinkingDialog.vue'
import ConfirmationDialog from './ConfirmationDialog.vue'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { Status, StatusIcon } from 'src/enums/statusEnum'
import { BaseSite } from 'src/classes/sites/baseSite'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'

export default defineComponent({
  name: 'manga-item',

  props: {
    url: {
      type: String,
      required: true
    }
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      mangaByUrl: 'manga',
      mobileView: 'mobileView'
    }),

    manga (): Manga {
      const manga = (this.mangaByUrl as (url: string) => Manga)(this.url)
      this.image = manga.image
      return manga
    },

    itemSize (): string {
      return this.mobileView ? 'sm' : 'md'
    },

    linkedSites (): Record<string, number> {
      return this.manga.linkedSites
    },

    hasLinkedSites (): boolean {
      return Object.keys(this.linkedSites).length > 0
    }
  },

  data () {
    return {
      siteNames: SiteName,
      siteTypes: SiteType,
      status: Status,
      statusIcon: StatusIcon,
      editing: false,
      newReadNum: -1 as number | undefined,
      newStatus: Status.READING as Status,
      newLinkedSites: undefined as Record<string, number> | undefined,
      newNotes: '' as string,
      newRating: 0 as number,
      image: ''
    }
  },

  methods: {
    ...mapMutations('reader', {
      pushUrlNavigation: 'pushUrlNavigation',
      updateManga: 'updateManga',
      removeManga: 'removeManga',
      pushNotification: 'pushNotification'
    }),

    onLinkClick (url: string) {
      this.pushUrlNavigation(new UrlNavigation(url, false))
    },

    onLinkingClicked () {
      this.$q.dialog({
        component: LinkingDialog,
        parent: this,
        linkedSites: this.newLinkedSites || this.manga.linkedSites,
        initialSearch: this.manga.title,
        searchPlaceholder: 'Search for the manga',
        manualPlaceholder: 'Or enter the url manually',
        confirmButton: 'Select'
      }).onOk((data: {
        url: string,
        siteType: SiteType | LinkingSiteType,
        linkedSites: Record<string, number>
      }) => {
        this.newLinkedSites = data.linkedSites
        this.linkSite(data.url, data.siteType)
      })
    },

    linkSite (url: string, siteType: SiteType | LinkingSiteType) {
      if (url === '') return

      const site = getSite(siteType)
      if (!site) {
        this.pushNotification(new NotifyOptions('Site not found'))
        return
      }

      const failMessage = 'Failed to get manga from URL'
      site.getMangaId(this, url).then(mangaId => {
        if (mangaId instanceof Error) {
          this.pushNotification(new NotifyOptions(mangaId, failMessage))
          return
        }

        if (mangaId !== -1) {
          const newLinkedSites = this.newLinkedSites || {}
          newLinkedSites[siteType] = mangaId

          this.newLinkedSites = newLinkedSites
        } else {
          this.pushNotification(new NotifyOptions('No ID found in URL', failMessage))
        }
      }).catch(error => {
        this.pushNotification(new NotifyOptions(error, failMessage))
      })
    },

    onDeleteClick () {
      this.$q.dialog({
        component: ConfirmationDialog,
        title: 'Delete manga',
        content: `Are you sure you want to delete ${this.manga.title}?`,
        imageUrl: this.manga.image
      }).onOk(() => {
        this.removeManga(this.url)
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      })
    },

    onReadClick () {
      this.manga.read = this.manga.chapter
      this.manga.readUrl = this.manga.chapterUrl
      this.manga.readNum = this.manga.chapterNum

      this.trySyncSites(this.manga.chapterNum)
      this.updateManga(this.manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
    },

    onToggleEditing () {
      this.editing = !this.editing
      this.newReadNum = this.manga.readNum
      this.newStatus = this.manga.status
      this.newLinkedSites = undefined
      this.newNotes = this.manga.notes || ''
      this.newRating = this.manga.rating || 0
    },

    onSaveEdit () {
      this.editing = !this.editing
      const readNumChanged = this.trySaveNewReadNum()
      const statusChanged = this.trySaveNewStatus()
      const linkedSitesChanged = this.trySaveNewLinkedSites()
      const notesChanged = this.trySaveNewNotes()
      const ratingChanged = this.trySaveNewRating()

      if (!readNumChanged && !statusChanged && !linkedSitesChanged && !notesChanged && !ratingChanged) return

      this.updateManga(this.manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
    },

    onImageError (src: string) {
      if (!this.linkedSites[SiteType.MangaDex]) return

      const baseUrl = `${MangaDexWorker.url}/images/manga/${this.linkedSites[SiteType.MangaDex]}`
      if (!src.includes(SiteType.MangaDex)) {
        this.image = `${baseUrl}.jpg`
      } else if (src.endsWith('jpg')) {
        this.image = `${baseUrl}.jpeg`
      } else if (src.endsWith('jpeg')) {
        this.image = `${baseUrl}.png`
      } else if (src.endsWith('png')) {
        this.image = `${baseUrl}.gif`
      }
    },

    trySaveNewReadNum (): boolean {
      if (typeof this.newReadNum === 'number' || this.newReadNum === undefined || this.newReadNum === -1) return false
      const parsedReadNum = parseFloat(this.newReadNum)
      if (isNaN(parsedReadNum) || parsedReadNum === this.manga.readNum) return false

      const isEqualToCurrent = parsedReadNum === this.manga.chapterNum
      this.manga.read = isEqualToCurrent ? this.manga.chapter : this.newReadNum
      this.manga.readUrl = isEqualToCurrent ? this.manga.chapterUrl : undefined
      this.manga.readNum = parsedReadNum

      this.trySyncSites(this.manga.readNum)
      return true
    },

    trySaveNewStatus (): boolean {
      const currentStatus = this.manga.status
      if (this.newStatus === currentStatus) return false

      this.manga.status = this.newStatus
      return true
    },

    trySaveNewLinkedSites (): boolean {
      if (this.newLinkedSites === undefined) return false

      this.manga.linkedSites = this.newLinkedSites
      return true
    },

    trySaveNewNotes (): boolean {
      const currentNotes = this.manga.notes || ''
      if (this.newNotes === currentNotes) return false

      this.manga.notes = this.newNotes
      return true
    },

    trySaveNewRating (): boolean {
      const currentRating = this.manga.rating || 0
      if (this.newRating === currentRating) return false

      this.manga.rating = this.newRating
      return true
    },

    trySyncSites (chapterNum: number) {
      const linkedSites = this.manga.linkedSites
      Object.keys(linkedSites).forEach(key => {
        const siteType = key as SiteType | LinkingSiteType
        const site = getSite(siteType)

        if (site) {
          this.syncSite(site, linkedSites[siteType], chapterNum)
        }
      })
    },

    syncSite (site: BaseSite, mangaId: number, chapterNum: number) {
      site.syncReadChapter(mangaId, chapterNum).then((result) => {
        if (result instanceof Error) {
          this.onSyncError(result, site, mangaId, chapterNum)
          return
        }

        const notifyOptions = new NotifyOptions(`Synced with ${SiteName[site.siteType]}`)
        notifyOptions.type = 'positive'
        this.pushNotification(notifyOptions)
      }).catch(error => {
        this.onSyncError(error, site, mangaId, chapterNum)
      })
    },

    onSyncError (error: string | Error, site: BaseSite, mangaId: number, chapterNum: number) {
      const notifyOptions = new NotifyOptions(error, `Failed to sync with ${SiteName[site.siteType]}`)

      notifyOptions.actions = [{
        label: 'Relog',
        handler: async () => {
          const loggedIn = await site.openLogin(this)
          if (loggedIn instanceof Error) {
            this.pushNotification(new NotifyOptions(loggedIn, 'Failed to log in'))
          } else if (loggedIn === true) {
            this.syncSite(site, mangaId, chapterNum)
          }
        },
        color: 'white'
      }]

      this.pushNotification(notifyOptions)
    }
  }
})
</script>

<style lang="scss" scoped>

.body--light {
  .unread-container {
    background-color: $grey-4;
  }

  .completed-container {
    background-color: $green-3;
  }

  .on-hold-container {
    background-color: $lime-4;
  }

  .plan-to-read-container {
    background-color: $blue-11;
  }

  .dropped-container {
    background-color: $red-4;
  }
}

.body--dark {
  .unread-container {
    background-color: $grey-9;
  }

  .completed-container {
    background-color: $teal-10;
  }

  .on-hold-container {
    background-color: $lime-10;
  }

  .plan-to-read-container {
    background-color: $blue-10;
  }

  .dropped-container {
    background-color: $brown-10;
  }
}

.unread-container a {
  color: $secondary;
}

.manga-image {
  min-width: 96px;
  width: 96px;
}

.manga-subtitle {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.vertical-center {
  margin-top: auto;
  margin-bottom: auto;
  height: 100%;
}

</style>
