<template>
  <q-card :class="{
    'completed-container': manga.completed,
    'unread-container': (!manga.completed && manga.chapter !== manga.read && (manga.readNum === undefined || manga.chapterNum !== manga.readNum))
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
          <div class="text-h6">
            <a class="manga-title" :href="manga.url" @click.prevent="onLinkClick(manga.url)">{{ manga.title }}</a>
          </div>

          <div v-if="!editing">
            <div class="text-body2 manga-subtitle">
              Read:&nbsp;&nbsp;&nbsp;&nbsp; <a v-if="manga.readUrl" :href="manga.readUrl" @click.prevent="onLinkClick(manga.readUrl || '#')">{{ manga.read }}</a>
              <span v-else>{{ manga.read }}</span>
            </div>

            <div class="text-body2 manga-subtitle">
              Current: <a v-if="manga.chapterUrl" :href="manga.chapterUrl" @click.prevent="onLinkClick(manga.chapterUrl)">{{ manga.chapter }}</a>
              <span v-else>{{ manga.chapter }}</span>
            </div>

            <div class="text-body2" v-if="manga.chapterDate">
              {{ manga.chapterDate }}
            </div>
          </div>

          <div v-else>
            <q-input v-model="newReadNum" label="Read:" stack-label dense class="q-mb-sm" />
            <q-checkbox v-if="editing" v-model="newCompleted" class="q-mb-sm" dense color="secondary" label="Completed" />
          </div>
        </div>

        <div v-if="!editing" class="text-subtitle1">
          {{ siteNames[manga.site] }}
        </div>
      </q-card-section>

      <q-space />

      <q-card-actions class="q-pl-none" vertical>
        <q-btn
          flat
          icon="close"
          @click="onDeleteClick()" />

        <q-btn
          flat
          icon="edit"
          v-if="!editing"
          @click="onStartEditing()" />
        <q-btn
          flat
          icon="save"
          v-else
          @click="onSaveEdit()" />

        <q-btn
          v-if="!manga.mangaDexId"
          color="info"
          icon="link"
          @click="onLinkingClicked()" />

        <q-space />

        <q-btn
          v-if="manga.chapter !== manga.read"
          color="secondary"
          icon="done"
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
import { syncReadChapter } from 'src/services/siteService'
import SearchDialog from './SearchDialog.vue'
import ConfirmationDialog from './ConfirmationDialog.vue'

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
      mangaByUrl: 'manga'
    }),

    manga (): Manga {
      return (this.mangaByUrl as (url: string) => Manga)(this.url)
    }
  },

  data () {
    return {
      siteNames: SiteName,
      editing: false,
      newReadNum: -1 as number | undefined,
      newCompleted: false as boolean
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
        this.linkMangaDex(this.manga.url)
        return
      }

      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Link with MangaDex',
        content: 'This will sync your read chapter with the reading progress on MangaDex.\nNote: the manga MUST be bookmarked on MangaDex.',
        initialSearch: this.manga.title,
        searchPlaceholder: 'Search for the manga',
        manualPlaceholder: 'Or enter the url manually',
        siteType: SiteType.MangaDex,
        confirmButton: 'Select'
      }).onOk((data: { url: string }) => {
        this.linkMangaDex(data.url)
      })
    },

    linkMangaDex (url: string) {
      if (url === '') {
        this.pushNotification(new NotifyOptions('Received empty URL'))
        return
      }

      const matches = /\/title\/(\d*)/gm.exec(url) || []
      let mangaId = -1

      for (const match of matches) {
        const parsedMatch = parseInt(match)
        if (!isNaN(parsedMatch)) mangaId = parsedMatch
      }

      if (mangaId !== -1) {
        this.manga.mangaDexId = mangaId

        this.updateManga(this.manga)
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      } else {
        this.pushNotification(new NotifyOptions('Could not find MangaDex ID in selected URL'))
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

      this.trySyncMangaDex(this.manga.chapterNum)
      this.updateManga(this.manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
    },

    onStartEditing () {
      this.editing = !this.editing
      this.newReadNum = this.manga.readNum
      this.newCompleted = this.manga.completed || false
    },

    onSaveEdit () {
      this.editing = !this.editing
      const readNumChanged = this.trySaveNewReadNum()
      const completedChanged = this.trySaveNewCompleted()

      if (!readNumChanged && !completedChanged) return

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

      this.trySyncMangaDex(this.manga.readNum)
      return true
    },

    trySaveNewCompleted (): boolean {
      const currentCompleted = this.manga.completed || false
      if (this.newCompleted === currentCompleted) return false

      this.manga.completed = this.newCompleted
      return true
    },

    trySyncMangaDex (chapterNum: number) {
      if (this.manga.mangaDexId) {
        syncReadChapter(this.manga.mangaDexId, chapterNum).then(() => {
          const notifyOptions = new NotifyOptions('Synced with MangaDex')
          notifyOptions.type = 'positive'
          this.pushNotification(notifyOptions)
        }).catch(error => {
          console.error(error)
          this.pushNotification(new NotifyOptions(Error('Failed to sync with MangaDex')))
        })
      }
    }
  }
})
</script>

<style lang="scss">

.body--light {
  .unread-container {
    background-color: $grey-4;
  }

  .completed-container {
    background-color: $green-3;
  }
}

.body--dark {
  .unread-container {
    background-color: $grey-9;
  }

  .completed-container {
    background-color: $teal-10;
  }
}

.unread-container a {
  color: $secondary;
}

.manga-image {
  min-width: 96px;
  width: 96px;
}

.manga-title {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.manga-subtitle {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.error-image {
  min-width: 96px;
  min-height: 96px;
  width: 96px;
  height: 96px;
}

</style>
