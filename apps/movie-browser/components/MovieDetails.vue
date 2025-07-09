<script setup lang="ts">
import type { MediaType, SearchParams } from '../types'

const props = defineProps<{
  mediaType: MediaType
}>()

const emit = defineEmits(['update:mediaType'])

defineExpose({ incrementIndex, decrementIndex })

const mediaType = useVModel(props, 'mediaType', emit)

const currentIndex = ref(0)

const query = ref<SearchParams>({ sortBy: 'title', ratingSource: 'csfd', order: 'asc' })
const { data: movies } = await useFetch('/api/movies', { query })

const currentMovie = computed(() => movies.value?.[currentIndex.value])
const moviesCount = computed(() => movies.value?.length ?? 0)
const nextMovie = computed(() => (movies.value?.[(currentIndex.value + 1) % moviesCount.value]))

useImagePreloader(nextMovie)

function incrementIndex() {
  currentIndex.value = (currentIndex.value + 1) % moviesCount.value
}

function decrementIndex() {
  currentIndex.value = (currentIndex.value - 1 + moviesCount.value) % moviesCount.value
}

function formatMinutesVerbose(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  else {
    return `${minutes}m`
  }
}

const additionalInfo = computed(() => {
  const items = []

  if (currentMovie.value?.tmdbData?.genres?.length) {
    items.push(currentMovie.value.tmdbData.genres.map((genre: any) => genre.genre.name).join(', '))
  }
  if (currentMovie.value?.tmdbData?.runtime) {
    items.push(formatMinutesVerbose(currentMovie.value.tmdbData.runtime))
  }
  return items
})

const title = computed(() => {
  return (currentMovie.value?.tmdbData?.title || currentMovie.value?.tmdbData?.originalTitle)!
})
</script>

<template>
  <div v-if="currentMovie" class="text-white">
    <NuxtImg v-if="currentMovie.tmdbData?.backdropPath" provider="tmdbBackdrop" :src="currentMovie.tmdbData.backdropPath" class="h-screen w-full object-cover" />
    <div class="absolute top-0 left-0 w-full h-full bg-black/70 flex flex-col px-[5vw] justify-center">
      <ControlPanel v-model:sort-options="query" v-model:media-type="mediaType" class="py-4" />
      <div class="flex gap-[5vw] my-auto">
        <NuxtImg v-if="currentMovie.tmdbData?.posterPath" provider="tmdbPoster" :src="currentMovie.tmdbData.posterPath" class="h-[60vh]" />
        <div class="space-y-4 max-h-[60vh] flex flex-col">
          <MediaRatings :csfd="currentMovie.csfdData?.voteAverage" :tmdb="currentMovie.tmdbData?.voteAverage" :rt="currentMovie.rtData?.criticsScore" />
          <MainHeader :title="title" :year="currentMovie.year" />
          <OriginCountry v-if="currentMovie.tmdbData?.originalLanguage && currentMovie.tmdbData?.originalTitle" :origin-country="currentMovie.tmdbData.originalLanguage" :origin-title="currentMovie.tmdbData.originalTitle" />
          <AdditionalInfo :items="additionalInfo" />
          <MediaOverview v-if="currentMovie.tmdbData?.overview" :overview="currentMovie.tmdbData.overview" />
        </div>
      </div>
      <div class="h-[72px]" />
    </div>
  </div>
</template>
