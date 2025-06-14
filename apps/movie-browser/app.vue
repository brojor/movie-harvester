<script setup lang="ts">
import type MovieDetails from './components/MovieDetails.vue'
import type { MediaType } from './types'
import { onKeyStroke, useFullscreen } from '@vueuse/core'

const { toggle: toggleFullscreen } = useFullscreen()

const movieDetails = ref<InstanceType<typeof MovieDetails>>()
const mediaType = ref<MediaType>('movie')

onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
  movieDetails.value?.incrementIndex()
})

onKeyStroke('ArrowUp', (e) => {
  e.preventDefault()
  movieDetails.value?.decrementIndex()
})

onKeyStroke('f', () => {
  toggleFullscreen()
})
</script>

<template>
  <Html class="bg-black" />

  <MovieDetails ref="movieDetails" v-model:media-type="mediaType" />
</template>
