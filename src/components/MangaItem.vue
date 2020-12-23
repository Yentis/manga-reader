<template>
  <q-card :class="{
    'completed-container': manga.status === status.COMPLETED,
    'on-hold-container': manga.status === status.ON_HOLD,
    'plan-to-read-container': manga.status === status.PLAN_TO_READ,
    'dropped-container': manga.status === status.DROPPED,
    'unread-container': ((manga.status === undefined || status.READING) && manga.chapter !== manga.read && (manga.readNum === undefined || manga.chapterNum !== manga.readNum))
  }">
    <q-card-section class="manga-item" horizontal>
      <q-img contain class="manga-image q-ma-sm" :src="manga.image">
        <template v-slot:error>
          <div class="error-image bg-negative">
            <q-icon class="full-width full-height" size="xl" name="image_not_supported"></q-icon>
          </div>
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

            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView }" v-if="manga.chapterDate">
              {{ manga.chapterDate }}
            </div>
          </div>

          <q-card-actions class="q-pa-none" align="left" vertical v-else>
            <q-input v-model="newReadNum" label="Read:" stack-label dense class="q-mb-sm" />
            <q-btn-dropdown no-caps :label="newStatus">
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
            <q-btn
              v-if="editing"
              color="info"
              label="Progress linking"
              :size="itemSize"
              @click="onLinkingClicked()" />
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
            class="q-mb-xs"
            width="1rem"
            :src="'https://' + site + '/favicon.ico'"
          />
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
      return (this.mangaByUrl as (url: string) => Manga)(this.url)
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
      status: Status,
      statusIcon: StatusIcon,
      editing: false,
      newReadNum: -1 as number | undefined,
      newStatus: Status.READING as Status,
      newLinkedSites: undefined as Record<string, number> | undefined
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
      if (this.manga.site === SiteType.MangaDex) {
        this.linkSite(this.manga.url, this.manga.site)
        return
      }

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

      const mangaId = site.getMangaId(url)

      if (mangaId !== -1) {
        const newLinkedSites = this.newLinkedSites || {}
        newLinkedSites[siteType] = mangaId

        this.newLinkedSites = newLinkedSites
      } else {
        this.pushNotification(new NotifyOptions('Could not find ID in selected URL'))
      }
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
    },

    onSaveEdit () {
      this.editing = !this.editing
      const readNumChanged = this.trySaveNewReadNum()
      const statusChanged = this.trySaveNewStatus()
      const linkedSitesChanged = this.trySaveNewLinkedSites()

      if (!readNumChanged && !statusChanged && !linkedSitesChanged) return

      this.updateManga(this.manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
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

    trySyncSites (chapterNum: number) {
      const linkedSites = this.manga.linkedSites
      Object.keys(linkedSites).forEach(key => {
        const siteType = key as SiteType | LinkingSiteType
        const site = getSite(siteType)

        if (site) {
          site.syncReadChapter(linkedSites[siteType], chapterNum).then((result) => {
            if (result instanceof Error) {
              const notifyOptions = new NotifyOptions(`Failed to sync with ${SiteName[siteType]}`)
              notifyOptions.caption = result.message
              this.pushNotification(notifyOptions)
              return
            }

            const notifyOptions = new NotifyOptions(`Synced with ${SiteName[siteType]}`)
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
          }).catch(error => {
            console.error(error)
            const notifyOptions = new NotifyOptions(`Failed to sync with ${SiteName[siteType]}`)
            if (error instanceof Error) {
              notifyOptions.caption = error.message
            } else {
              notifyOptions.caption = error as string
            }
            this.pushNotification(notifyOptions)
          })
        }
      })
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

.error-image {
  min-width: 96px;
  min-height: 96px;
  width: 96px;
  height: 96px;
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
