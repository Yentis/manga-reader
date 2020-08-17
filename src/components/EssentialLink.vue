<template>
  <q-item
    clickable
    tag="a"
    target="_blank"
    :href="link"
  >
    <div class="columns is-vcentered">
      <div class="column is-narrow">
        <q-icon
          size="xl"
          :name="icon" />
      </div>
      <div class="column is-narrow">
        <span class="title">{{ title }}</span>
        <br>
        <span class="subtitle">{{ caption }}</span>
      </div>
    </div>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    link: {
      type: String,
      default: '#'
    },

    icon: {
      type: String,
      default: ''
    }
  }
})
</script>
