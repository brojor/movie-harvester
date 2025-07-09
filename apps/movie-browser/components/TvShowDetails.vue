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
const { data: tvShows } = await useFetch('/api/tv-shows', { query })

const currentTvShow = computed(() => tvShows.value?.[currentIndex.value])
const tvShowsCount = computed(() => tvShows.value?.length ?? 0)
const nextTvShow = computed(() => (tvShows.value?.[(currentIndex.value + 1) % tvShowsCount.value]))

useImagePreloader(nextTvShow)

function incrementIndex() {
  currentIndex.value = (currentIndex.value + 1) % tvShowsCount.value
}

function decrementIndex() {
  currentIndex.value = (currentIndex.value - 1 + tvShowsCount.value) % tvShowsCount.value
}

const additionalInfo = computed(() => {
  const items = []

  if (currentTvShow.value?.tmdbData?.genres?.length) {
    items.push(currentTvShow.value.tmdbData.genres.map((genre: any) => genre.genre.name).join(', '))
  }
  return items
})

const title = computed(() => {
  return (currentTvShow.value?.tmdbData?.name || currentTvShow.value?.tmdbData?.originalName)!
})
</script>

<template>
  <div v-if="currentTvShow" class="text-white">
    <NuxtImg v-if="currentTvShow.tmdbData?.backdropPath" provider="tmdbBackdrop" :src="currentTvShow.tmdbData.backdropPath" class="h-screen w-full object-cover" />
    <div class="absolute top-0 left-0 w-full h-full bg-black/70 flex flex-col px-[5vw] justify-center">
      <ControlPanel v-model:sort-options="query" v-model:media-type="mediaType" class="py-4" />
      <div class="flex gap-[5vw] my-auto">
        <NuxtImg v-if="currentTvShow.tmdbData?.posterPath" provider="tmdbPoster" :src="currentTvShow.tmdbData.posterPath" class="h-[60vh]" />
        <div class="space-y-4 max-h-[60vh] flex flex-col">
          <MediaRatings :csfd="currentTvShow.csfdData?.voteAverage" :tmdb="currentTvShow.tmdbData?.voteAverage" :rt="currentTvShow.rtData?.criticsScore" />
          <MainHeader :title="title" :year="Number(currentTvShow.tmdbData?.firstAirDate?.split('-')[0])" />
          <OriginCountry v-if="currentTvShow.tmdbData?.originalLanguage && currentTvShow.tmdbData?.originalName" :origin-country="currentTvShow.tmdbData.originalLanguage" :origin-title="currentTvShow.tmdbData.originalName" />
          <AdditionalInfo :items="additionalInfo" />
          <MediaOverview v-if="currentTvShow.tmdbData?.overview" :overview="currentTvShow.tmdbData.overview" />
        </div>
      </div>
      <div class="h-[72px]" />
    </div>
  </div>
</template>
