<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Link with external sites</q-toolbar-title>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-toolbar>

      <div class="q-mx-md q-mt-md text-body2">
        This will sync your read chapter with the selected site.
        <br>
        Note: the manga MUST be in your library on the selected site.
      </div>

      <q-table
        :data="data"
        :selected.sync="selected"
        class="q-mt-sm"
        selection="single"
        hide-header
        hide-bottom
        dense
        separator="none"
        row-key="name"
      >
        <template v-slot:body-cell-id="props">
          <q-td :props="props">
            <q-btn
              v-if="props.value && !props.row.deleted"
              flat
              class="full-width"
              color="positive"
              icon="link"
              @click="onLinkClicked(props.row.value, true)"
            />
            <q-btn
              v-else
              flat
              :disable="!props.value"
              class="full-width"
              color="negative"
              icon="link_off"
              @click="onLinkClicked(props.row.value, false)"
            />
          </q-td>
        </template>
        <template v-slot:body-cell-deleted />
      </q-table>

      <manga-search
        class="q-pt-none"
        v-model="url"
        :searchPlaceholder="searchPlaceholder"
        :manualPlaceholder="manualPlaceholder"
        :initialSearch="initialSearch"
        :siteType="selected[0].value" />

      <q-card-actions>
        <q-space />

        <q-btn color="secondary" :label="confirmButton" @click="onOKClick"></q-btn>
        <q-btn label="Cancel" v-close-popup></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import { SiteName } from 'src/enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import MangaSearch from './SearchComponent.vue'
import { Manga } from 'src/classes/manga'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  props: {
    mangaUrl: {
      type: String,
      required: true
    },
    initialSearch: String,
    searchPlaceholder: String,
    manualPlaceholder: String,
    confirmButton: String
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      mangaByUrl: 'manga'
    }),

    manga (): Manga {
      return (this.mangaByUrl as (url: string) => Manga)(this.mangaUrl)
    }
  },

  data () {
    return {
      url: '',
      selected: [
        {
          name: SiteName[LinkingSiteType.MangaDex],
          value: LinkingSiteType.MangaDex
        }
      ],
      data: [] as {
        name: SiteName,
        value: string,
        id: number | string,
        deleted: boolean
      }[]
    }
  },

  mounted () {
    this.updateSearchResults([])
    this.data = Object.values(LinkingSiteType).map(site => {
      const id = this.manga.linkedSites ? this.manga.linkedSites[site] : ''

      return {
        name: SiteName[site],
        value: site,
        id,
        deleted: false
      }
    })
  },

  components: {
    MangaSearch
  },

  methods: {
    ...mapMutations('reader', {
      updateSearchResults: 'updateSearchResults'
    }),

    show () {
      this.$refs.dialog.show()
    },

    hide () {
      this.updateSearchResults([])
      this.$refs.dialog.hide()
    },

    onDialogHide () {
      this.$emit('hide')
    },

    onOKClick () {
      this.$emit('ok', {
        url: this.url,
        siteType: this.selected[0].value,
        linkedSites: this.getLinkedSites()
      })
      this.hide()
    },

    onCancelClick () {
      this.hide()
    },

    onLinkClicked (siteType: string, enabled: boolean) {
      const index = this.data.findIndex(site => site.value === siteType)
      if (index === -1) return
      const site = this.data[index]

      site.deleted = enabled
      this.$set(this.data, index, site)
    },

    getLinkedSites () {
      const linkedSites = {} as Record<string, number>
      this.data.filter(site => site.id && !site.deleted).forEach(site => {
        if (typeof site.id === 'number') {
          linkedSites[site.value] = site.id
        }
      })

      return linkedSites
    }
  }
})
</script>

<style lang="scss" scoped>

.content {
  white-space: pre-wrap;
}

</style>
