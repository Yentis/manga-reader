<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-toolbar>

      <manga-search
        v-model="url"
        :content="content"
        :searchPlaceholder="searchPlaceholder"
        :manualPlaceholder="manualPlaceholder"
        :initialSearch="initialSearch"
        :siteType="siteType" />

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
import { mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import MangaSearch from './SearchComponent.vue'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  props: {
    title: String,
    content: String,
    initialSearch: String,
    searchPlaceholder: String,
    manualPlaceholder: String,
    siteType: String,
    confirmButton: String
  },

  data () {
    return {
      url: ''
    }
  },

  mounted () {
    this.updateSearchResults([])
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
      this.$emit('ok', { url: this.url })
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>
