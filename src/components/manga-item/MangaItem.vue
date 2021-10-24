<template>
  <q-card
    :class="{
      'completed-container': mangaStatus === status.COMPLETED,
      'on-hold-container': mangaStatus === status.ON_HOLD,
      'plan-to-read-container': mangaStatus === status.PLAN_TO_READ,
      'dropped-container': mangaStatus === status.DROPPED,
      'unread-container': isUnread,
      'read-container': mangaStatus === status.READING && !isUnread
    }"
  >
    <q-card-section
      class="q-pa-none"
    >
      <q-card-section
        class="manga-item q-pa-none"
        horizontal
      >
        <q-img
          contain
          class="manga-image q-my-sm q-ml-xs q-mr-sm"
          fit="scale-down"
          :src="mangaImage"
          @error="onImageLoadFailed"
        >
          <template #error>
            <q-icon
              class="full-width full-height"
              size="xl"
              name="image_not_supported"
            />
          </template>
        </q-img>

        <q-card-section
          class="full-width q-pl-none q-pt-sm q-pb-none q-pr-sm column"
        >
          <q-card-section
            horizontal
            :class="{ 'text-subtitle2': mobileView, 'text-h6': !mobileView }"
          >
            <a
              :href="url"
              @click.prevent="navigate(url)"
            >{{ mangaTitle }}</a>

            <q-space />

            <q-btn
              v-if="editing"
              flat
              icon="close"
              :size="itemSize"
              @click="toggleEditing()"
            />
          </q-card-section>

          <div v-if="!editing">
            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Read:&nbsp;&nbsp;&nbsp;&nbsp; <router-link
                v-if="mangaReadUrl?.startsWith('/')"
                :to="mangaReadUrl"
              >
                {{ mangaRead }}
              </router-link>
              <a
                v-else-if="mangaReadUrl"
                :href="mangaReadUrl"
                @click.prevent="navigate(mangaReadUrl || '#')"
              >{{ mangaRead }}</a>
              <span v-else>{{ mangaRead }}</span>
            </div>

            <div :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'manga-subtitle': true }">
              Current: <router-link
                v-if="mangaChapterUrl?.startsWith('/')"
                :to="mangaChapterUrl"
              >
                {{ mangaChapter }}
              </router-link>
              <a
                v-else-if="mangaChapterUrl"
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

          <div
            v-if="editing"
            style="max-width: 75%"
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

            <q-card-actions
              class="q-px-none"
            >
              <q-input
                v-model="newUrl"
                stack-label
                label="URL:"
                class="q-mb-sm"
                style="flex-grow: 1"
              />

              <q-btn
                color="button"
                text-color="button"
                class="q-ml-xs"
                padding="sm md"
                icon="search"
                :size="itemSize"
                @click="openSearchDialog()"
              />
            </q-card-actions>
          </div>

          <q-space />

          <q-card-section
            horizontal
            class="q-mb-sm"
          >
            <q-card-section
              class="q-pa-none"
            >
              <q-card-section
                v-if="!editing"
                horizontal
                class="status-text"
              >
                <span>{{ isUnread ? 'New Chapter' : mangaStatus }}</span>
                <q-icon
                  v-if="isUnread"
                  class="q-ml-xs"
                  name="celebration"
                  size="xs"
                />
              </q-card-section>

              <div
                v-if="!editing"
                :class="{ 'text-caption': mobileView, 'text-body2': !mobileView, 'end-self': true }"
              >
                <q-icon
                  class="q-mr-xs q-mb-xs"
                  :name="statusIcon[mangaStatus]"
                  size="xs"
                />
                <span>{{ getSiteNameByUrl(mangaSite) || 'Unknown site' }}</span>

                <q-icon
                  v-if="mangaShouldUpdate"
                  class="q-ml-xs center-self"
                  name="refresh"
                  color="positive"
                />
                <q-icon
                  class="q-ml-xs center-self"
                  :name="hasLinkedSites ? 'link' : 'link_off'"
                  :color="hasLinkedSites ? 'positive' : 'negative'"
                />
                <span
                  v-for="(id, site) in mangaLinkedSites"
                  :key="site"
                  class="q-mx-xs"
                >
                  <q-img
                    class="q-ma-none q-pa-none"
                    height="1rem"
                    width="1rem"
                    :src="`https://icons.duckduckgo.com/ip2/${site}.ico`"
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

            <q-card-section
              v-if="!editing"
              horizontal
              class="q-gutter-sm end-self"
            >
              <q-btn
                color="button"
                text-color="button"
                padding="sm md"
                icon="edit"
                :size="itemSize"
                @click="toggleEditing()"
              />

              <q-btn
                v-if="isUnread"
                color="unread"
                text-color="button"
                padding="sm md"
                icon="done"
                :size="itemSize"
                @click="readManga()"
              />
            </q-card-section>
          </q-card-section>
        </q-card-section>
      </q-card-section>
    </q-card-section>

    <q-card-section
      v-if="editing"
      horizontal
    >
      <q-card-actions
        align="left"
        vertical
      >
        <q-checkbox
          v-if="mangaStatus !== status.READING"
          v-model="newShouldUpdate"
          dense
          class="q-mb-xs"
          :size="itemSize"
          label="Check on refresh"
        />

        <q-btn-dropdown
          no-caps
          class="editing-box"
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
              class="center-items"
              @click="newStatus = curStatus"
            >
              <q-icon
                size="sm"
                class="q-mr-sm"
                :name="statusIcon[curStatus]"
              />
              <span class="full-width text-center">{{ curStatus }}</span>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-card-actions
          class="q-pa-none"
        >
          <q-btn-dropdown
            no-caps
            class="editing-box q-mt-xs"
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
            flat
            icon="close"
            :size="itemSize"
            @click="newRating = 0"
          />
        </q-card-actions>

        <q-btn
          no-caps
          class="editing-box q-mt-xs"
          label="Progress Linking"
          :size="itemSize"
          @click="openLinkingDialog()"
        />

        <q-btn
          no-caps
          class="editing-box"
          label="Alternate Sources"
          :size="itemSize"
          @click="openAltSourceDialog()"
        />
      </q-card-actions>

      <q-space />

      <q-card-actions
        vertical
      >
        <q-btn
          color="unread"
          text-color="button"
          padding="sm md"
          icon="save"
          :loading="saving"
          :size="itemSize"
          @click="saveManga()"
        />

        <q-space />

        <q-btn
          color="negative"
          text-color="button"
          padding="sm md"
          icon="delete"
          :size="itemSize"
          @click="deleteManga()"
        />
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { Status, StatusIcon } from '../../enums/statusEnum'
import useMobileView from '../../composables/useMobileView'
import useUrlNavigation from '../../composables/useUrlNavigation'
import { useMangaItem } from '../../composables/useManga'
import useProgressLinking from '../../composables/useProgressLinking'
import useAltSources from '../../composables/useAltSources'
import useMangaList from '../../composables/useMangaList'
import { isMangaRead } from '../../services/sortService'
import { getSiteNameByUrl } from '../../utils/siteUtils'

export default defineComponent({
  name: 'MangaItem',

  props: {
    url: {
      type: String,
      required: true
    }
  },

  emits: ['imageLoadFailed'],

  setup (props, context) {
    const manga = useMangaItem(props.url)
    const { mobileView } = useMobileView()
    const { openLinkingDialog } = useProgressLinking(manga.title, manga.linkedSites, manga.newLinkedSites)
    const { openAltSourceDialog } = useAltSources(manga.altSources, manga.title, manga.newSources)
    const { showUpdateMangaDialog } = useMangaList()

    const onImageLoadFailed = () => {
      context.emit('imageLoadFailed')
    }

    const itemSize = computed(() => {
      return mobileView.value ? 'sm' : 'md'
    })

    const hasLinkedSites = computed(() => {
      return Object.keys(manga.linkedSites.value).length > 0
    })
    const isUnread = computed(() => {
      return manga.status.value === Status.READING &&
      !isMangaRead(
        manga.chapter.value,
        manga.chapterNum.value,
        manga.read.value,
        manga.readNum.value
      )
    })

    const { navigate } = useUrlNavigation()

    const openSearchDialog = async () => {
      const url = await showUpdateMangaDialog(manga.title.value)
      if (url === null) return

      manga.newUrl.value = url
    }

    return {
      status: Status,
      statusIcon: StatusIcon,
      editing: manga.editing,
      saving: manga.saving,

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
      mangaImage: manga.image,

      mobileView,
      itemSize,
      navigate,
      onImageLoadFailed,
      getSiteNameByUrl,

      hasLinkedSites,
      openLinkingDialog,
      openAltSourceDialog,
      openSearchDialog,

      isUnread,
      deleteManga: manga.deleteManga,
      readManga: manga.readManga,
      toggleEditing: manga.toggleEditing,
      saveManga: manga.saveManga
    }
  }
})
</script>

<style lang="scss" scoped src="./manga-item.scss"></style>
