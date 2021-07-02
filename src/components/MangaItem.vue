<template>
  <q-card
    :class="{
      'completed-container': mangaStatus === status.COMPLETED,
      'on-hold-container': mangaStatus === status.ON_HOLD,
      'plan-to-read-container': mangaStatus === status.PLAN_TO_READ,
      'dropped-container': mangaStatus === status.DROPPED,
      'unread-container': isUnread
    }"
  >
    <q-card-section
      class="manga-item"
      horizontal
    >
      <q-img
        contain
        class="manga-image q-ma-sm"
        fit="scale-down"
        :src="image"
        @error="updateImageSource($event.target.src)"
      >
        <template #error>
          <q-icon
            class="full-width full-height"
            size="xl"
            name="image_not_supported"
          />
        </template>
      </q-img>

      <q-card-section class="q-pb-none q-pl-sm q-pr-none flex-column-between">
        <div class="q-mb-sm">
          <div :class="{ 'text-subtitle2': mobileView, 'text-h6': !mobileView }">
            <a
              :href="url"
              @click.prevent="navigate(url)"
            >{{ mangaTitle }}</a>
          </div>

          <div v-if="!editing">
            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Read:&nbsp;&nbsp;&nbsp;&nbsp; <a
                v-if="mangaReadUrl"
                :href="mangaReadUrl"
                @click.prevent="navigate(mangaReadUrl || '#')"
              >{{ mangaRead }}</a>
              <span v-else>{{ mangaRead }}</span>
            </div>

            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Current: <a
                v-if="mangaChapterUrl"
                :href="mangaChapterUrl"
                @click.prevent="navigate(mangaChapterUrl)"
              >{{ mangaChapter }}</a>
              <span v-else>{{ mangaChapter }}</span>
            </div>

            <div
              v-if="mangaNotes"
              :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }"
            >
              Notes:&nbsp;&nbsp; <span>{{ mangaNotes }}</span>
            </div>

            <div
              v-if="mangaChapterDate"
              :class="{ 'text-caption': mobileView, 'text-body2': !mobileView }"
            >
              {{ mangaChapterDate }}
            </div>

            <q-rating
              v-if="mangaRating"
              v-model="mangaRating"
              readonly
              size="1em"
              class="q-mt-sm"
              :max="10"
              :color="mangaRating > 6 ? 'positive' : mangaRating > 3 ? 'warning' : 'negative'"
            />
          </div>

          <q-card-actions
            v-else
            class="q-pa-none"
            align="left"
            vertical
          >
            <q-input
              v-model="newReadNum"
              label="Read:"
              stack-label
              dense
              class="q-mb-sm"
            />

            <q-input
              v-model="newNotes"
              stack-label
              label="Notes:"
              class="q-mb-sm"
            />

            <q-input
              v-model="newUrl"
              stack-label
              label="URL:"
              class="q-mb-sm"
            />

            <q-checkbox
              v-if="mangaStatus !== status.READING"
              v-model="newShouldUpdate"
              label="Check on refresh"
            />

            <q-btn-dropdown
              no-caps
              class="q-mb-xs"
              :size="itemSize"
              :label="newStatus"
            >
              <q-list
                v-for="curStatus in Object.values(status)"
                :key="curStatus"
              >
                <q-item
                  v-close-popup
                  clickable
                  @click="newStatus = curStatus"
                >
                  <q-icon
                    size="sm"
                    class="q-mr-sm vertical-center"
                    :name="statusIcon[curStatus]"
                  />
                  <span class="full-width vertical-center text-center">{{ curStatus }}</span>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-card-actions class="q-pl-none">
              <q-btn-dropdown
                no-caps
                :label="'Rating: ' + newRating"
                :size="itemSize"
              >
                <q-list
                  v-for="index in 10"
                  :key="index"
                >
                  <q-item
                    v-close-popup
                    dense
                    clickable
                    @click="newRating = index"
                  >
                    <q-item-section>
                      <q-item-label>{{ index }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>

              <q-btn
                v-if="newRating > 0"
                icon="close"
                :size="itemSize"
                @click="newRating = 0"
              />
            </q-card-actions>

            <q-btn
              no-caps
              label="Progress Linking"
              :size="itemSize"
              @click="openLinkingDialog()"
            />

            <q-btn
              no-caps
              label="Alternate Sources"
              :size="itemSize"
              @click="openAltSourceDialog()"
            />
          </q-card-actions>
        </div>

        <div
          v-if="!editing"
          :class="{ 'text-caption': mobileView, 'text-body2': !mobileView }"
        >
          <q-icon
            class="q-mr-xs q-mb-xs"
            :name="statusIcon[mangaStatus]"
            size="xs"
          />
          <span>{{ siteNames[mangaSite] }}</span>
          <q-icon
            v-if="mangaShouldUpdate"
            class="q-ml-xs"
            name="refresh"
            color="positive"
          />
          <q-icon
            class="q-ml-xs"
            :name="hasLinkedSites ? 'link' : 'link_off'"
            :color="hasLinkedSites ? 'positive' : 'negative'"
          />
          <span
            v-for="(id, site) in mangaLinkedSites"
            :key="site"
            class="q-ml-xs"
          >
            <q-img
              class="q-ma-none q-pa-none"
              height="1rem"
              width="1rem"
              :src="'https://' + site + '/favicon.ico'"
            >
              <template #error>
                <q-icon
                  class="absolute-full full-height full-width"
                  name="image_not_supported"
                />
              </template>
            </q-img>
          </span>
        </div>
      </q-card-section>

      <q-space />

      <q-card-actions
        class="q-pl-none"
        vertical
      >
        <q-btn
          v-if="editing"
          flat
          icon="close"
          :size="itemSize"
          @click="toggleEditing()"
        />

        <q-btn
          v-if="!editing"
          flat
          icon="edit"
          :size="itemSize"
          @click="toggleEditing()"
        />
        <q-btn
          v-else
          flat
          icon="save"
          :size="itemSize"
          @click="saveManga()"
        />

        <q-space />

        <q-btn
          v-if="mangaChapter !== mangaRead && !editing"
          color="secondary"
          icon="done"
          :size="itemSize"
          @click="readManga()"
        />
        <q-btn
          v-if="editing"
          color="negative"
          icon="delete"
          :size="itemSize"
          @click="deleteManga()"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { Status, StatusIcon } from 'src/enums/statusEnum'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'
import useMobileView from 'src/composables/useMobileView'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import { useMangaItem } from 'src/composables/useManga'
import useProgressLinking from 'src/composables/useProgressLinking'
import useAltSources from 'src/composables/useAltSources'

export default defineComponent({
  name: 'MangaItem',

  props: {
    url: {
      type: String,
      required: true
    }
  },

  setup (props) {
    const manga = useMangaItem(props.url)
    const { mobileView } = useMobileView()
    const { openLinkingDialog } = useProgressLinking(props.url, manga.newLinkedSites)
    const { openAltSourceDialog } = useAltSources(props.url, manga.newSources)

    const itemSize = computed(() => {
      return mobileView.value ? 'sm' : 'md'
    })

    const hasLinkedSites = computed(() => {
      return Object.keys(manga.linkedSites.value).length > 0
    })
    const isUnread = computed(() => {
      return manga.status.value === Status.READING &&
        manga.chapter.value !== manga.read.value &&
        (manga.readNum.value === undefined || manga.chapterNum.value !== manga.readNum.value)
    })

    const image = ref(manga.image.value)
    watch(manga.image, (newImage) => {
      image.value = newImage
    })

    const updateImageSource = (src: string) => {
      if (!manga.linkedSites.value[SiteType.MangaDex]) return

      const baseUrl = `${MangaDexWorker.url}/images/manga/${manga.linkedSites.value[SiteType.MangaDex]}`
      if (!src.includes(SiteType.MangaDex)) {
        image.value = `${baseUrl}.jpg`
      } else if (src.endsWith('jpg')) {
        image.value = `${baseUrl}.jpeg`
      } else if (src.endsWith('jpeg')) {
        image.value = `${baseUrl}.png`
      } else if (src.endsWith('png')) {
        image.value = `${baseUrl}.gif`
      }
    }

    const { navigate } = useUrlNavigation()

    return {
      siteNames: SiteName,
      status: Status,
      statusIcon: StatusIcon,
      editing: manga.editing,

      newUrl: manga.newUrl,
      newReadNum: manga.newReadNum,
      newStatus: manga.newStatus,
      newNotes: manga.newNotes,
      newShouldUpdate: manga.newShouldUpdate,
      newRating: manga.newRating,

      mangaSite: manga.site,
      mangaChapter: manga.chapter,
      mangaChapterUrl: manga.chapterUrl,
      mangaChapterDate: manga.chapterDate,
      mangaTitle: manga.title,
      mangaRead: manga.read,
      mangaReadUrl: manga.readUrl,
      mangaLinkedSites: manga.linkedSites,
      mangaStatus: manga.status,
      mangaNotes: manga.notes,
      mangaRating: manga.rating,
      mangaShouldUpdate: manga.shouldUpdate,

      mobileView,
      itemSize,
      image,
      navigate,
      updateImageSource,

      hasLinkedSites,
      openLinkingDialog,
      openAltSourceDialog,

      isUnread,
      deleteManga: manga.deleteManga,
      readManga: manga.readManga,
      toggleEditing: manga.toggleEditing,
      saveManga: manga.saveManga
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
