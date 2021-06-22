<template>
  <q-dialog
    ref="dialog"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Add alternate sources</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <div class="q-mx-md q-mt-md text-body2">
        This will let you add additional sources for your manga.
        These will be used if your main source cannot be loaded.
      </div>

      <q-list
        v-if="data.length > 0"
        class="q-mt-sm"
        bordered
      >
        <q-item
          v-for="source in data"
          :key="source.url"
        >
          <q-item-section>
            <q-item-label>
              {{ source.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              color="negative"
              icon="delete"
              @click="onDeleteClicked(source.url)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-actions>
        <q-space />

        <q-btn
          flat
          class="q-pr-xs"
          color="positive"
          icon="add"
          @click="onAddClicked"
        />
      </q-card-actions>

      <q-card-actions>
        <q-space />

        <q-btn
          color="primary"
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
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { NotifyOptions } from 'src/classes/notifyOptions'
import SearchDialog from './SearchDialog.vue'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({

  props: {
    sources: {
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
      data: [] as {
        name: SiteName,
        site: SiteType,
        url: string
      }[]
    }
  },

  mounted () {
    this.updateSearchResults([])
    const sources = this.sources as Record<string, string>
    this.data = Object.keys(sources).map(source => {
      const siteType = source as SiteType

      return {
        name: SiteName[siteType],
        site: siteType,
        url: sources[source]
      }
    })
  },

  methods: {
    ...mapMutations('reader', {
      updateSearchResults: 'updateSearchResults',
      pushNotification: 'pushNotification'
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
        sources: this.getSources()
      })
      this.hide()
    },

    onAddClicked () {
      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Add manga',
        initialSearch: this.initialSearch,
        searchPlaceholder: this.searchPlaceholder,
        manualPlaceholder: this.manualPlaceholder,
        confirmButton: this.confirmButton,
        excludedUrls: this.data.map((item) => item.url)
      }).onOk((data: { url: string }) => {
        const site = Object.values(SiteType).find(site => data.url.includes(site))
        if (site === undefined) {
          this.pushNotification(new NotifyOptions(Error('Valid site not found')))
          return
        }

        this.data.push({ name: SiteName[site], site, url: data.url })
      })
    },

    onCancelClick () {
      this.hide()
    },

    onDeleteClicked (url: string) {
      const index = this.data.findIndex(site => site.url === url)
      if (index === -1) return
      this.data.splice(index, 1)
    },

    getSources () {
      const sources = {} as Record<string, string>
      this.data.forEach(item => {
        sources[item.site] = item.url
      })

      return sources
    }
  }
})
</script>

<style lang="scss" scoped>

.content {
  white-space: pre-wrap;
}

</style>
