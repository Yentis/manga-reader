<template>
  <q-page class="mx-2 my-2">
    <div class="columns is-vcentered is-mobile">
      <div class="column is-narrow">
        <button class="button is-primary" @click="addModalShown = true">Add manga</button>
      </div>
      <div class="column is-narrow">
        <button class="button is-success" @click="onRefreshManga">Refresh manga</button>
      </div>
      <div v-if="!this.$q.platform.is.mobile" class="column has-text-right">
        <label class="checkbox">
          <input type="checkbox" v-model="openBrowser" @change="saveOpenBrowser">
          Open in browser
        </label>
      </div>
    </div>

    <div v-if="notificationShown" class="notification mt-2 is-danger">
      <button class="delete" @click="notificationShown = false"></button>
      {{ notificationText }}
    </div>

    <progress v-if="loading" class="progress is-large is-info mt-2"></progress>

    <div class="mt-2">
      <div v-for="(manga, index) in mangaList" :key="manga.url" class="columns is-mobile" :style="{ 'background-color': manga.chapter !== manga.read ? 'lightgrey' : '' }">
        <div class="column is-narrow">
          <img style="width: 96px" v-lazy="manga.image">
          <br>
          <button v-if="manga.chapter !== manga.read" class="button is-success mb-2 mr-2" @click="onReadClick(index)">
            <q-icon name="done"></q-icon>
          </button>
          <button class="button is-danger" @click="onDeleteClick(index)">
            <q-icon name="delete"></q-icon>
          </button>
        </div>
        <div class="column">
          <span class="title is-5">
            <a :href="manga.url" @click="onLinkClick($event, index)">{{ manga.title }}</a>
          </span>
          <br>
          <span class="subtitle is-6" style="text-overflow: ">
            Read: <a v-if="manga.readUrl" :href="manga.readUrl" @click="onLinkClick($event, index)">{{ manga.read }}</a>
            <span v-else>{{ manga.read }}</span>
          </span>
          <br>
          <span class="subtitle is-6">
            Current: <a v-if="manga.chapterUrl" :href="manga.chapterUrl" @click="onLinkClick($event, index)">{{ manga.chapter }}</a>
            <span v-else>{{ manga.chapter }}</span>
          </span>
        </div>
      </div>
    </div>

    <div :class="{ modal: true, 'is-active': addModalShown }">
      <div class="modal-background" @click="addModalShown = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Add manga</p>
          <button class="delete" aria-label="close" @click="addModalShown = false"></button>
        </header>
        <section class="modal-card-body">
          <input class="input mb-2" type="text" placeholder="Enter manga url here" v-model="url">
          <span><b>Supported sites:</b></span>
          <ul>
            <li v-for="site in siteTypes" :key="site">{{ site }}</li>
          </ul>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="addManga">Add</button>
          <button class="button" @click="addModalShown = false">Cancel</button>
        </footer>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { LocalStorage, openURL } from 'quasar'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/classes/siteType'
import { getMangaInfo } from 'src/sites'

const MANGA_LIST_KEY = 'manga'
const OPEN_BROWSER_KEY = 'open_browser'
let timeout: NodeJS.Timeout

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title > b.title ? 1 : -1
  } else {
    return b.chapter !== b.read ? 1 : -1
  }
}

export default defineComponent({
  name: 'Index',
  data () {
    let mangaList: Manga[] = []
    const localMangaList: Manga[] | null = LocalStorage.getItem(MANGA_LIST_KEY)
    if (localMangaList) {
      mangaList = localMangaList
    }

    let openBrowser = false
    const localOpenBrowser: boolean | null = LocalStorage.getItem(OPEN_BROWSER_KEY)
    if (localOpenBrowser) {
      openBrowser = localOpenBrowser
    }

    mangaList.sort(mangaSort)

    return {
      addModalShown: false,
      notificationShown: false,
      loading: false,
      url: '',
      notificationText: '',
      mangaList,
      openBrowser,
      siteTypes: SiteType
    }
  },
  methods: {
    addManga () {
      this.loading = true
      this.addModalShown = false

      for (const site of Object.values(SiteType)) {
        if (this.url.includes(site)) {
          getMangaInfo(this.url, site).then(manga => {
            manga.read = manga.chapter
            manga.readUrl = manga.chapterUrl
            this.saveManga(manga)
          }).catch(error => this.showError(error))

          this.url = ''
          return
        }
      }

      this.showError(Error('Valid site not found'))
    },
    saveManga (manga: Manga) {
      for (const entry of this.mangaList) {
        if (entry.url === manga.url) {
          this.showError(Error('Manga already exists'))
          return
        }
      }

      this.mangaList.unshift(manga)
      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
      this.loading = false
    },
    saveOpenBrowser () {
      LocalStorage.set(OPEN_BROWSER_KEY, this.openBrowser)
    },
    showError (error: Error) {
      console.error(error)
      if (timeout) {
        clearTimeout(timeout)
      }

      this.notificationText = error.message
      this.notificationShown = true
      this.loading = false
      this.url = ''

      timeout = setTimeout(() => {
        this.notificationShown = false
      }, 3000)
    },
    onLinkClick (e: MouseEvent, index: number) {
      if (!this.openBrowser) return

      e.preventDefault()
      openURL(this.mangaList[index].url)
    },
    onReadClick (index: number) {
      const manga = this.mangaList[index]

      this.mangaList[index].read = manga.chapter
      this.mangaList[index].readUrl = manga.chapterUrl

      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
    },
    onDeleteClick (index: number) {
      this.mangaList.splice(index, 1)
      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
    },
    onRefreshManga () {
      if (this.loading) return

      this.loading = true
      const promises: Promise<Manga>[] = []

      for (let i = 0; i < this.mangaList.length; i++) {
        const manga = this.mangaList[i]
        promises.push(getMangaInfo(manga.url, manga.site))
      }

      Promise.all(promises).then(results => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i]

          this.mangaList[i].chapter = result.chapter
          this.mangaList[i].chapterUrl = result.chapterUrl
        }

        LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
        this.loading = false
      }).catch(error => this.showError(error))
    }
  }
})
</script>
