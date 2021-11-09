<template>
  <q-page>
    <q-card>
      <q-card-actions align="between">
        <q-btn-dropdown
          color="primary"
          class="q-mt-xs q-ml-xs"
          no-caps
          :label="`${chapterList[chapterIndex]?.chapterNum || 0} - ${chapterList[chapterIndex]?.chapter || 'Unknown'}`"
        >
          <q-list>
            <q-item
              v-for="chapter in chapterList"
              :key="chapter.id"
              v-close-popup
              clickable
              @click="onChapterSelected(chapter)"
            >
              <q-item-section>
                <q-item-label>{{ `${chapter.chapterNum} - ${chapter.chapter}` }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn
          flat
          icon="close"
          :to="isStatic ? '/mangareader' : '/'"
        />
      </q-card-actions>
    </q-card>

    <div
      class="q-mt-sm q-px-sm full-width"
      style="display: inline-block"
    >
      <q-intersection
        v-for="image in imageList"
        :key="image"
        :style="`height:${imageHeight}px`"
        class="q-mb-xs full-width"
      >
        <q-img
          :src="image"
          :style="`max-height:${imageHeight}px`"
          fit="contain"
        />
      </q-intersection>
    </div>

    <q-card>
      <q-card-actions align="around">
        <q-btn
          v-if="chapterList[chapterIndex + 1]"
          icon="navigate_before"
          color="primary"
          @click="onPrevious"
        />

        <q-btn
          v-if="chapterList[chapterIndex - 1]"
          icon="navigate_next"
          color="primary"
          @click="onNext"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { useRoute } from 'vue-router'
import { ChapterData, getChaptersFromData, getImagesFromData } from '../services/mangaViewerService'
import useNotification from '../composables/useNotification'
import { NotifyOptions } from '../classes/notifyOptions'
import useWindowSize from '../composables/useWindowSize'
import { useQuasar } from 'quasar'
import { getPlatform } from '../services/platformService'
import { Platform } from '../enums/platformEnum'

export default defineComponent({
  name: 'PageMangaViewer',

  setup () {
    const imageList: Ref<string[]> = ref([])
    const chapterList: Ref<ChapterData[]> = ref([])
    const chapterIndex = ref(-1)
    const $route = useRoute()
    const $q = useQuasar()
    const { notification } = useNotification()
    const { windowSize } = useWindowSize()

    const imageHeight = computed(() => windowSize.value.y * 0.95)

    const type = ($route.query.type as string) || ''
    const data = ($route.query.data as string) || ''

    const init = async () => {
      $q.loading.show({
        delay: 100
      })

      const imageData = await getImagesFromData(type, data)
      if (!imageData) return
      imageList.value = imageData.images

      const chapters = await getChaptersFromData(type, data)
      chapterList.value = chapters

      if (imageData.id === -1) {
        chapterIndex.value = 0
        onChapterSelected(chapters[0])
        return
      }

      const targetChapter = chapters.findIndex((chapter) => chapter.id === imageData.id)
      chapterIndex.value = Math.max(0, targetChapter)
    }

    const onChapterSelected = (chapter: ChapterData | undefined) => {
      if (!chapter) return
      window.scrollTo(0, 0)

      $q.loading.show({
        delay: 100
      })

      getImagesFromData(type, JSON.stringify({ chapter: chapter.id })).then((imageData) => {
        if (!imageData) return
        imageList.value = imageData.images

        const targetChapter = chapterList.value.findIndex((chapter) => chapter.id === imageData.id)
        chapterIndex.value = targetChapter
      }).catch((error) => {
        notification.value = new NotifyOptions(error)
        console.error(error)
      }).finally(() => {
        $q.loading.hide()
      })
    }

    const onPrevious = () => {
      return onChapterSelected(chapterList.value[chapterIndex.value + 1])
    }

    const onNext = () => {
      return onChapterSelected(chapterList.value[chapterIndex.value - 1])
    }

    const startInit = () => {
      init().catch((error) => {
        const notifyOptions = new NotifyOptions(error, 'Failed to load chapter')
        notifyOptions.actions = [{
          label: 'Retry',
          handler: () => { startInit() },
          color: 'white'
        }]
        notification.value = notifyOptions
      }).finally(() => {
        $q.loading.hide()
      })
    }

    onMounted(startInit)

    return {
      imageHeight,
      imageList,
      chapterList,
      chapterIndex,
      onChapterSelected,
      onPrevious,
      onNext,
      isStatic: getPlatform() === Platform.Static
    }
  }
})
</script>
