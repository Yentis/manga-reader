<template>
  <q-dialog
    ref="dialog"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <manga-search
        v-model="url"
        :content="content"
        :search-placeholder="searchPlaceholder"
        :manual-placeholder="manualPlaceholder"
        :initial-search="initialSearch"
        :site-type="siteType"
        :excluded-urls="excludedUrls"
      />

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
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
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
    siteType: {
      type: String,
      default: undefined
    },
    confirmButton: {
      type: String,
      default: ''
    },
    excludedUrls: {
      type: Array,
      default: () => [] as string[]
    }
  },

  data () {
    return {
      url: ''
    }
  },

  mounted () {
    this.updateSearchResults([])
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
      this.$emit('ok', { url: this.url })
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>
