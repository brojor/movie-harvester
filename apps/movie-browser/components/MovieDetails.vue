<script setup lang="ts">
import type { GenreWithRelation, MediaType, Movie, SearchParams } from '../types'
import { usePageCache } from '@/composables/usePageCache'

/** Props / emits */
const props = defineProps<{ mediaType: MediaType }>()
const emit = defineEmits(['update:mediaType'])
defineExpose({ incrementIndex, decrementIndex })

/** Stav */
const mediaType = useVModel(props, 'mediaType', emit)
const movieIndex = ref(0)
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
  const key = ['movies', filters.value.sortBy, filters.value.ratingSource, filters.value.order, filters.value.genreId, p, pageSize].join(':')

  return key
}

interface MoviesResponse {
  data: Movie[]
  pagination: { page: number, limit: number, total: number, hasMore: boolean }
}

function fetchMovies(p: number) {
  return $fetch<MoviesResponse>('/api/movies', { query: { ...filters.value, page: p, limit: pageSize } })
}

/** Page cache (cache-first) */
const { value: activePageData, loadPage, peekPage } = usePageCache<MoviesResponse>(keyFor, fetchMovies)

/** Derivace pro UI */
const activeMovies = computed(() => activePageData.value?.data ?? [])
const activePagination = computed(() =>
  activePageData.value?.pagination ?? { page: 1, limit: pageSize, total: 0, hasMore: false },
)
const moviesCount = computed(() => activeMovies.value.length)
const currentMovie = computed(() => activeMovies.value?.[movieIndex.value])

/** Props do template */
const title = computed<string>(() =>
  (currentMovie.value?.tmdbData?.title || currentMovie.value?.tmdbData?.originalTitle) ?? '',
)

function formatMinutesVerbose(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

const additionalInfo = computed<string[]>(() => {
  const movie = currentMovie.value
  if (!movie)
    return []

  const items: string[] = []

  if (movie.tmdbData?.genres?.length) {
    items.push(movie.tmdbData.genres.map((g: GenreWithRelation) => g.genre.name).join(', '))
  }
  if (movie.tmdbData?.runtime) {
    items.push(formatMinutesVerbose(movie.tmdbData.runtime))
  }
  if (movie.createdAt) {
    items.push(formatDate(movie.createdAt.toString()))
  }
  return items
})

/** Prefetch sousedních stránek */
const PREFETCH_THRESHOLD = 3

function preloadAdjacentPages() {
  const remainingMovies = moviesCount.value - movieIndex.value - 1
  if (remainingMovies <= PREFETCH_THRESHOLD && activePagination.value.hasMore) {
    void loadPage(currentPage.value + 1)
  }
  if (movieIndex.value <= PREFETCH_THRESHOLD && currentPage.value > 1) {
    void loadPage(currentPage.value - 1)
  }
}

/** Navigace */
async function incrementIndex() {
  const nextIndex = movieIndex.value + 1

  if (nextIndex >= moviesCount.value && activePagination.value.hasMore) {
    const page = currentPage.value + 1
    await loadPage(page, { activate: true })
    currentPage.value = page
    movieIndex.value = 0
  }
  else if (nextIndex < moviesCount.value) {
    movieIndex.value = nextIndex
  }

  preloadAdjacentPages()
}

async function decrementIndex() {
  const prevIndex = movieIndex.value - 1

  if (prevIndex < 0 && currentPage.value > 1) {
    const page = currentPage.value - 1
    await loadPage(page, { activate: true })
    currentPage.value = page
    movieIndex.value = Math.max(0, (activeMovies.value?.length ?? 1) - 1)
  }
  else if (prevIndex >= 0) {
    movieIndex.value = prevIndex
  }

  preloadAdjacentPages()
}

/** Přednačítání obrázků (bez composables v computed) */
const prefetchedFirstMovie = ref<Movie | null>(null)
watchEffect(() => {
  prefetchedFirstMovie.value = peekPage(currentPage.value + 1).value?.data?.[0] ?? null
})

const nextMovie = computed(() => {
  const nextIndex = movieIndex.value + 1
  if (nextIndex < moviesCount.value)
    return activeMovies.value?.[nextIndex]
  if (prefetchedFirstMovie.value)
    return prefetchedFirstMovie.value
  if (activePagination.value.hasMore)
    return undefined
  return activeMovies.value?.[0]
})
useImagePreloader(nextMovie)

/** Změna filtrů */
watch(
  filters,
  async () => {
    console.log('filters changed', filters.value)
    movieIndex.value = 0
    currentPage.value = 1

    await loadPage(1, { activate: true })
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div v-if="currentMovie" class="text-white">
    <NuxtImg v-if="currentMovie.tmdbData?.backdropPath" provider="tmdbBackdrop" :src="currentMovie.tmdbData.backdropPath" class="h-screen w-full object-cover" />
    <div class="absolute top-0 left-0 w-full h-full bg-black/70 flex flex-col px-[5vw] justify-center">
      <ControlPanel v-model:sort-options="filters" v-model:media-type="mediaType" class="py-4" />
      <div class="flex gap-[5vw] my-auto">
        <NuxtImg v-if="currentMovie.tmdbData?.posterPath" provider="tmdbPoster" :src="currentMovie.tmdbData.posterPath" class="h-[60vh]" />
        <div class="space-y-4 max-h-[60vh] flex flex-col">
          <MediaRatings :csfd="currentMovie.csfdData?.voteAverage" :tmdb="currentMovie.tmdbData?.voteAverage" :rt="currentMovie.rtData?.criticsScore" />
          <MainHeader :title="title" :year="currentMovie.year" />
          <OriginCountry v-if="currentMovie.tmdbData?.originalLanguage && currentMovie.tmdbData?.originalTitle" :origin-country="currentMovie.tmdbData.originalLanguage" :origin-title="currentMovie.tmdbData.originalTitle" />
          <AdditionalInfo :items="additionalInfo" />
          <SourceTopics :topics="currentMovie.topics" />
          <MediaOverview v-if="currentMovie.tmdbData?.overview" :overview="currentMovie.tmdbData.overview" />
        </div>
      </div>
      <div class="h-[72px]" />
    </div>
  </div>
</template>
