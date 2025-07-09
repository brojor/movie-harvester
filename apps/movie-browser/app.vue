<script setup lang="ts">
import type MovieDetails from './components/MovieDetails.vue'
import type TvShowDetails from './components/TvShowDetails.vue'
import type { MediaType } from './types'
import { onKeyStroke, useFullscreen } from '@vueuse/core'

const { toggle: toggleFullscreen } = useFullscreen()

const movieDetails = ref<InstanceType<typeof MovieDetails>>()
const tvShowDetails = ref<InstanceType<typeof TvShowDetails>>()
const mediaType = ref<MediaType>('movie')

onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
  mediaType.value === 'movie' ? movieDetails.value?.incrementIndex() : tvShowDetails.value?.incrementIndex()
})

onKeyStroke('ArrowUp', (e) => {
  e.preventDefault()
  mediaType.value === 'movie' ? movieDetails.value?.decrementIndex() : tvShowDetails.value?.decrementIndex()
})

onKeyStroke('f', () => {
  toggleFullscreen()
})
</script>

<template>
  <Html class="bg-black" />

  <MovieDetails v-if="mediaType === 'movie'" ref="movieDetails" v-model:media-type="mediaType" />
  <TvShowDetails v-if="mediaType === 'tv-show'" ref="tvShowDetails" v-model:media-type="mediaType" />
</template>
