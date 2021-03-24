<template>
  <q-dialog
    ref="dialog"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Link with external sites</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
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
        v-model="url"
        class="q-pt-none"
        :search-placeholder="searchPlaceholder"
        :manual-placeholder="manualPlaceholder"
        :initial-search="initialSearch"
        :site-type="selected.length > 0 ? selected[0].value : linkingSiteType.MangaDex"
      />

      <q-card-actions>
        <q-space />

        <q-btn
          color="secondary"
          :disable="selected.length === 0"
          :label="confirmButton"
          @click="onOKClick"
        />
        <q-btn
          v-close-popup
          label="Cancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import { mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import { SiteName } from 'src/enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import MangaSearch from './SearchComponent.vue'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({

  components: {
    MangaSearch
  },
  props: {
    linkedSites: {
      type: Object,
      required: true
    },
    initialSearch: {
      type: String,
      default: ''
    },
    searchPlaceholder: {
      type: String,
      default: ''
    },
    manualPlaceholder: {
      type: String,
      default: ''
    },
    confirmButton: {
      type: String,
      default: ''
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
      }[],
      linkingSiteType: LinkingSiteType
    }
  },

  mounted () {
    this.updateSearchResults([])
    this.data = Object.values(LinkingSiteType).map(site => {
      const linkedSites = this.linkedSites as Record<string, number>
      const id = linkedSites ? linkedSites[site] : ''

      return {
        name: SiteName[site],
        value: site,
        id,
        deleted: false
      }
    })
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
