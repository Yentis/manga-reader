import useMangaList from './useMangaList'
import { computed, ref, watch } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { Manga } from '../classes/manga'
import { SiteType } from '../enums/siteEnum'
import { useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import useProgressLinking from './useProgressLinking'
import { Status } from 'src/enums/statusEnum'
import useAltSources from './useAltSources'
import { getMangaInfoByUrl } from 'src/services/siteService'
import useNotification from './useNotification'
import { NotifyOptions } from 'src/classes/notifyOptions'

export default function useManga (curUrl: string) {
  const { notification } = useNotification()

  const {
    mangaList,
    updateManga,
    updateMangaAltSources,
    updateMangaRead,
    updateMangaReadNum,
    updateMangaReadUrl,
    updateMangaLinkedSites,
    updateMangaStatus,
    updateMangaNotes,
    updateMangaRating,
    updateMangaShouldUpdate
  } = useMangaList()

  const manga = computed(() => {
    return mangaList.value.find(manga => manga.url === curUrl) || new Manga(curUrl, SiteType.ArangScans)
  })

  const url = computed({
    get: () => manga.value.url,
    set: async (val) => {
      const result = await getMangaInfoByUrl(val)
      if (result instanceof Error) {
        notification.value = new NotifyOptions(result, 'Failed to update URL')
        return
      }
      const curManga = Manga.clone(manga.value)
      const newManga = Manga.inherit(curManga, result)

      updateManga(curUrl, newManga)
      curUrl = val
    }
  })

  const altSources = computed({
    get: () => manga.value.altSources,
    set: (val) => { updateMangaAltSources(curUrl, val) }
  })

  const read = computed({
    get: () => manga.value.read,
    set: (val) => { updateMangaRead(curUrl, val) }
  })

  const readNum = computed({
    get: () => manga.value.readNum,
    set: (val) => { updateMangaReadNum(curUrl, val) }
  })

  const readUrl = computed({
    get: () => manga.value.readUrl,
    set: (val) => { updateMangaReadUrl(curUrl, val) }
  })

  const linkedSites = computed({
    get: () => manga.value.linkedSites,
    set: (val) => { updateMangaLinkedSites(curUrl, val) }
  })

  const status = computed({
    get: () => manga.value.status,
    set: (val) => { updateMangaStatus(curUrl, val) }
  })

  const notes = computed({
    get: () => manga.value.notes,
    set: (val) => { updateMangaNotes(curUrl, val) }
  })

  const rating = computed({
    get: () => manga.value.rating,
    set: (val) => { updateMangaRating(curUrl, val) }
  })

  const shouldUpdate = computed({
    get: () => manga.value.shouldUpdate,
    set: (val) => { updateMangaShouldUpdate(curUrl, val) }
  })

  const title = computed(() => manga.value.title)
  const image = computed(() => manga.value.image)

  const $q = useQuasar()
  const showDeleteMangaDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Delete manga',
          content: `Are you sure you want to delete ${title.value}?`,
          imageUrl: image.value
        }
      }).onOk(() => {
        resolve(true)
      }).onCancel(() => {
        resolve(false)
      })
    })
  }

  return {
    altSources,
    url,
    site: computed(() => manga.value.site),
    chapter: computed(() => manga.value.chapter),
    chapterNum: computed(() => manga.value.chapterNum),
    chapterUrl: computed(() => manga.value.chapterUrl),
    chapterDate: computed(() => manga.value.chapterDate),
    image,
    title,
    read,
    readNum,
    readUrl,
    linkedSites,
    status,
    notes,
    rating,
    shouldUpdate,
    showDeleteMangaDialog
  }
}

export function useMangaItem (url: string) {
  const newLinkedSites: Ref<Record<string, number> | undefined> = ref()
  const newSources: Ref<Record<string, string> | undefined> = ref()

  const { removeManga, storeManga } = useMangaList()
  const { syncSites, saveLinkedSites } = useProgressLinking(url, newLinkedSites)
  const { saveSources } = useAltSources(url, newSources)
  const manga = useManga(url)

  const deleteManga = async () => {
    const confirmed = await manga.showDeleteMangaDialog()
    if (!confirmed) return

    removeManga(url)
    storeManga()
  }

  const readManga = () => {
    manga.read.value = manga.chapter.value
    manga.readUrl.value = manga.chapterUrl.value
    manga.readNum.value = manga.chapterNum.value

    syncSites(manga.chapterNum.value)
    storeManga()
  }

  const editing = ref(false)
  const saving = ref(false)

  const saveManga = async () => {
    saving.value = true

    let urlChanged = false
    try {
      urlChanged = await saveUrl()
    } finally {
      saving.value = false
    }

    const readNumChanged = saveReadNum()
    const statusChanged = saveStatus()
    const notesChanged = saveNotes()
    const shouldUpdateChanged = saveShouldUpdate()
    const ratingChanged = saveRating()
    const linkedSitesChanged = saveLinkedSites()
    const sourcesChanged = saveSources()

    editing.value = !editing.value

    if (!urlChanged &&
        !readNumChanged &&
        !statusChanged &&
        !linkedSitesChanged &&
        !notesChanged &&
        !ratingChanged &&
        !sourcesChanged &&
        !shouldUpdateChanged) return

    storeManga()
  }

  const newUrl = ref('')
  const newReadNum: Ref<number | undefined> = ref(-1)
  const newStatus = ref(Status.READING)
  const newNotes = ref('')
  const newShouldUpdate = ref(false)
  const newRating = ref(0)

  const toggleEditing = () => {
    editing.value = !editing.value
    newUrl.value = manga.url.value
    newReadNum.value = manga.readNum.value
    newStatus.value = manga.status.value
    newNotes.value = manga.notes.value || ''
    newShouldUpdate.value = manga.shouldUpdate.value || false
    newRating.value = manga.rating.value || 0
    newLinkedSites.value = undefined
    newSources.value = undefined
  }

  const saveUrl = (): Promise<boolean> => {
    const currentUrl = manga.url.value || ''
    if (newUrl.value === currentUrl) return Promise.resolve(false)

    return new Promise((resolve) => {
      const stopWatching = watch(manga.url, () => {
        resolve(true)
        stopWatching()
      })

      manga.url.value = newUrl.value
    })
  }

  const saveReadNum = (): boolean => {
    if (typeof newReadNum.value === 'number' || newReadNum.value === undefined || newReadNum.value === -1) return false
    const parsedReadNum = parseFloat(newReadNum.value)
    if (isNaN(parsedReadNum) || parsedReadNum === manga.readNum.value) return false

    const isEqualToCurrent = parsedReadNum === manga.chapterNum.value
    manga.read.value = isEqualToCurrent ? manga.chapter.value : newReadNum.value
    manga.readUrl.value = isEqualToCurrent ? manga.chapterUrl.value : undefined
    manga.readNum.value = parsedReadNum

    syncSites(manga.readNum.value)
    return true
  }

  const saveStatus = (): boolean => {
    if (newStatus.value === manga.status.value) return false

    manga.status.value = newStatus.value
    return true
  }

  const saveNotes = (): boolean => {
    const currentNotes = manga.notes.value || ''
    if (newNotes.value === currentNotes) return false

    manga.notes.value = newNotes.value
    return true
  }

  const saveShouldUpdate = (): boolean => {
    const currentShouldUpdate = manga.shouldUpdate.value || false
    if (newShouldUpdate.value === currentShouldUpdate) return false

    manga.shouldUpdate.value = newShouldUpdate.value
    return true
  }

  const saveRating = (): boolean => {
    const currentRating = manga.rating.value || 0
    if (newRating.value === currentRating) return false

    manga.rating.value = newRating.value
    return true
  }

  return {
    ...manga,
    deleteManga,
    readManga,
    toggleEditing,
    editing,
    saving,
    newUrl,
    newReadNum,
    newStatus,
    newNotes,
    newShouldUpdate,
    newRating,
    newLinkedSites,
    newSources,
    saveManga
  }
}
