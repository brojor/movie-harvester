<script setup lang="ts">
import type { TmdbSeason } from '@repo/database'
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
  if (currentTvShow.value?.tmdbData?.numberOfEpisodes) {
    items.push(`${currentTvShow.value.tmdbData.numberOfEpisodes} epizod`)
  }
  if (currentTvShow.value?.createdAt) {
    items.push(new Date(currentTvShow.value.createdAt).toLocaleDateString('cs-CZ'))
  }
  return items
})

const title = computed(() => {
  return (currentTvShow.value?.tmdbData?.name || currentTvShow.value?.tmdbData?.originalName)!
})

function getReleaseYear(date: string | null) {
  if (!date)
    return null
  return date.split('-')[0]
}

const sortedSeasons = computed(() => {
  return currentTvShow.value?.tmdbData?.seasons
    ?.slice()
    .filter((season: TmdbSeason) => !!season.airDate && season.name !== 'Speciály')
    .sort((a: TmdbSeason, b: TmdbSeason) => {
      if (a.airDate && b.airDate) {
        return new Date(a.airDate).getTime() - new Date(b.airDate).getTime()
      }
      return 0
    })
})

// TODO: refactor duplicate code from MovieRatings.vue
function getColor(value: number): string {
  if (value < 40)
    return 'text-gray-500'
  if (value < 70)
    return 'text-blue-500'
  return 'text-red-500'
}
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
          <MainHeader :title="title" :year="Number(currentTvShow.tmdbData?.firstAirDate?.split('-')[0])" :network-logo="currentTvShow.tmdbData?.networks?.[0]?.network?.logoPath" />
          <OriginCountry v-if="currentTvShow.tmdbData?.originalLanguage && currentTvShow.tmdbData?.originalName" :origin-country="currentTvShow.tmdbData.originalLanguage" :origin-title="currentTvShow.tmdbData.originalName" />
          <AdditionalInfo :items="additionalInfo" />
          <SourceTopics :topics="currentTvShow.topics" />
          <div class="grid grid-cols-2 gap-x-16 w-max">
            <div v-for="season in sortedSeasons" :key="season.id" class="">
              <div v-if="season.airDate && season.episodeCount" class="flex gap-2">
                <span :class="getColor((season.voteAverage ?? 0) * 10)">&#9632;&nbsp;{{ season.name }}</span>
                <span class="text-gray-400">({{ getReleaseYear(season.airDate) }})</span> -
                <span>{{ season.episodeCount }} epizod</span>
              </div>
            </div>
          </div>
          <MediaOverview v-if="currentTvShow.tmdbData?.overview" :overview="currentTvShow.tmdbData.overview" />
        </div>
      </div>
      <div class="h-[72px]" />
    </div>
  </div>
</template>
