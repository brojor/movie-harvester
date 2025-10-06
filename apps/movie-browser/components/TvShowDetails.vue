<script setup lang="ts">
import type { TmdbSeason } from '@repo/database'
import type { GenreWithRelation, MediaType, SearchParams, TvShow } from '../types'
import { usePageCache } from '@/composables/usePageCache'

/** Props / emits */
const props = defineProps<{ mediaType: MediaType }>()
const emit = defineEmits(['update:mediaType'])
defineExpose({ incrementIndex, decrementIndex })

/** Stav */
const mediaType = useVModel(props, 'mediaType', emit)
const tvShowIndex = ref(0)
const currentPage = ref(1)
const pageSize = 20

/** Filtry – bez page/limit */
const filters = ref<Omit<SearchParams, 'page' | 'limit'>>({
  sortBy: 'title',
  ratingSource: 'csfd',
  order: 'asc',
})

/** Klíč a fetcher */
function keyFor(p: number) {
  return ['tv-shows', filters.value.sortBy, filters.value.ratingSource, filters.value.order, filters.value.genreId, p, pageSize].join(':')
}

interface TvShowsResponse {
  data: TvShow[]
  pagination: { page: number, limit: number, total: number, hasMore: boolean }
}

function fetchTvShows(p: number) {
  return $fetch<TvShowsResponse>('/api/tv-shows', { query: { ...filters.value, page: p, limit: pageSize } })
}

/** Page cache (cache-first) */
const { value: activePageData, loadPage, peekPage } = usePageCache<TvShowsResponse>(keyFor, fetchTvShows)

/** Derivace pro UI */
const activeTvShows = computed(() => activePageData.value?.data ?? [])
const activePagination = computed(() =>
  activePageData.value?.pagination ?? { page: 1, limit: pageSize, total: 0, hasMore: false },
)
const tvShowsCount = computed(() => activeTvShows.value.length)
const currentTvShow = computed(() => activeTvShows.value?.[tvShowIndex.value])

/** Props do template */
const title = computed<string>(() =>
  (currentTvShow.value?.tmdbData?.name || currentTvShow.value?.tmdbData?.originalName) ?? '',
)

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

const additionalInfo = computed<string[]>(() => {
  const tvShow = currentTvShow.value
  if (!tvShow)
    return []

  const items: string[] = []

  if (tvShow.tmdbData?.genres?.length) {
    items.push(tvShow.tmdbData.genres.map((g: GenreWithRelation) => g.genre.name).join(', '))
  }
  if (tvShow.tmdbData?.numberOfEpisodes) {
    items.push(`${tvShow.tmdbData.numberOfEpisodes} epizod`)
  }
  if (tvShow.createdAt) {
    items.push(formatDate(tvShow.createdAt.toString()))
  }
  return items
})

/** Prefetch sousedních stránek */
const PREFETCH_THRESHOLD = 3

function preloadAdjacentPages() {
  const remainingTvShows = tvShowsCount.value - tvShowIndex.value - 1
  if (remainingTvShows <= PREFETCH_THRESHOLD && activePagination.value.hasMore) {
    void loadPage(currentPage.value + 1)
  }
  if (tvShowIndex.value <= PREFETCH_THRESHOLD && currentPage.value > 1) {
    void loadPage(currentPage.value - 1)
  }
}

/** Navigace */
async function incrementIndex() {
  const nextIndex = tvShowIndex.value + 1

  if (nextIndex >= tvShowsCount.value && activePagination.value.hasMore) {
    const page = currentPage.value + 1
    await loadPage(page, { activate: true })
    currentPage.value = page
    tvShowIndex.value = 0
  }
  else if (nextIndex < tvShowsCount.value) {
    tvShowIndex.value = nextIndex
  }

  preloadAdjacentPages()
}

async function decrementIndex() {
  const prevIndex = tvShowIndex.value - 1

  if (prevIndex < 0 && currentPage.value > 1) {
    const page = currentPage.value - 1
    await loadPage(page, { activate: true })
    currentPage.value = page
    tvShowIndex.value = Math.max(0, (activeTvShows.value?.length ?? 1) - 1)
  }
  else if (prevIndex >= 0) {
    tvShowIndex.value = prevIndex
  }

  preloadAdjacentPages()
}

/** Přednačítání obrázků (bez composables v computed) */
const prefetchedFirstTvShow = ref<TvShow | null>(null)
watchEffect(() => {
  prefetchedFirstTvShow.value = peekPage(currentPage.value + 1).value?.data?.[0] ?? null
})

const nextTvShow = computed(() => {
  const nextIndex = tvShowIndex.value + 1
  if (nextIndex < tvShowsCount.value)
    return activeTvShows.value?.[nextIndex]
  if (prefetchedFirstTvShow.value)
    return prefetchedFirstTvShow.value
  if (activePagination.value.hasMore)
    return undefined
  return activeTvShows.value?.[0]
})
useImagePreloader(nextTvShow)

/** Změna filtrů */
watch(
  filters,
  async () => {
    tvShowIndex.value = 0
    currentPage.value = 1

    await loadPage(1, { activate: true })
  },
  { deep: true, immediate: true },
)

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
      <ControlPanel v-model:sort-options="filters" v-model:media-type="mediaType" class="py-4" />
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
      <!-- Indikátor stránkování -->
      <div class="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
        Stránka {{ activePagination.page }} | {{ tvShowIndex + 1 }}/{{ tvShowsCount }}
        <span v-if="activePagination.hasMore" class="text-green-400">• Další dostupné</span>
      </div>
    </div>
  </div>
</template>
