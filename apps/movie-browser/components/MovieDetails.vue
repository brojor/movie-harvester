<script setup lang="ts">
import type { MediaType, SearchParams } from '../types'

const props = defineProps<{
  mediaType: MediaType
}>()

const emit = defineEmits(['update:mediaType'])

defineExpose({ incrementIndex, decrementIndex })

const mediaType = useVModel(props, 'mediaType', emit)

const currentIndex = ref(0)
const currentPage = ref(1)
const pageSize = 20

// Cache pro načtené stránky
const moviesCache = ref<Map<number, any[]>>(new Map())
const paginationCache = ref<Map<number, any>>(new Map())

const query = ref<SearchParams>({
  sortBy: 'title',
  ratingSource: 'csfd',
  order: 'asc',
  page: currentPage.value,
  limit: pageSize,
})

const { data: moviesResponse, refresh: refreshMovies } = await useFetch('/api/movies', { query })

// Uložíme první stránku do cache
watch(moviesResponse, (newResponse) => {
  if (newResponse?.data && newResponse?.pagination) {
    moviesCache.value.set(currentPage.value, newResponse.data)
    paginationCache.value.set(currentPage.value, newResponse.pagination)
  }
}, { immediate: true })

const movies = computed(() => moviesCache.value.get(currentPage.value) ?? [])
const pagination = computed(() => paginationCache.value.get(currentPage.value) ?? { page: 1, limit: pageSize, total: 0, hasMore: false })

const currentMovie = computed(() => movies.value?.[currentIndex.value])
const moviesCount = computed(() => movies.value?.length ?? 0)

// Správná logika pro nextMovie - zohledňuje přechody mezi stránkami
const nextMovie = computed(() => {
  const nextIndex = currentIndex.value + 1

  // Pokud je další film na stejné stránce
  if (nextIndex < moviesCount.value) {
    return movies.value?.[nextIndex]
  }

  // Pokud je další film na další stránce (pokud existuje v cache)
  if (moviesCache.value.has(currentPage.value + 1)) {
    const nextPageMovies = moviesCache.value.get(currentPage.value + 1) ?? []
    return nextPageMovies[0]
  }

  // Pokud je další film na další stránce (pokud existuje další stránka)
  if (pagination.value.hasMore) {
    return null // Bude načteno při přechodu
  }

  // Pokud jsme na konci, vraťme první film ze současné stránky
  return movies.value?.[0]
})

useImagePreloader(nextMovie)

// Funkce pro přednačítání stránky
async function preloadPage(pageNumber: number) {
  if (moviesCache.value.has(pageNumber)) {
    return // Stránka už je v cache
  }

  try {
    const response = await $fetch('/api/movies', {
      query: {
        ...query.value,
        page: pageNumber,
      },
    })

    if (response?.data && response?.pagination) {
      moviesCache.value.set(pageNumber, response.data)
      paginationCache.value.set(pageNumber, response.pagination)
    }
  }
  catch (error) {
    console.warn(`Failed to preload page ${pageNumber}:`, error)
  }
}

// Funkce pro detekci blížení se ke konci stránky
function checkAndPreload() {
  const remainingItems = moviesCount.value - currentIndex.value - 1
  const preloadThreshold = 3 // Přednačteme, když zbývají 3 nebo méně položek

  // Přednačteme další stránku, pokud se blížíme ke konci
  if (remainingItems <= preloadThreshold && pagination.value.hasMore) {
    const nextPage = currentPage.value + 1
    if (!moviesCache.value.has(nextPage)) {
      preloadPage(nextPage)
    }
  }

  // Přednačteme předchozí stránku, pokud jsme na začátku a existuje
  if (currentIndex.value <= preloadThreshold && currentPage.value > 1) {
    const prevPage = currentPage.value - 1
    if (!moviesCache.value.has(prevPage)) {
      preloadPage(prevPage)
    }
  }
}

async function incrementIndex() {
  const nextIndex = currentIndex.value + 1

  // Pokud jsme na konci stránky a existuje další stránka v cache
  if (nextIndex >= moviesCount.value && moviesCache.value.has(currentPage.value + 1)) {
    currentPage.value++
    currentIndex.value = 0
    // Přednačteme další stránku pro plynulou navigaci
    checkAndPreload()
  }
  // Pokud jsme na konci stránky a existuje další stránka, načteme ji
  else if (nextIndex >= moviesCount.value && pagination.value.hasMore) {
    currentPage.value++
    query.value.page = currentPage.value
    currentIndex.value = 0
    await refreshMovies()
  }
  // Jinak normální navigace v rámci stránky
  else if (nextIndex < moviesCount.value) {
    currentIndex.value = nextIndex
    checkAndPreload()
  }
  // Pokud jsme na konci a není další stránka, zůstaneme na posledním filmu
}

async function decrementIndex() {
  const prevIndex = currentIndex.value - 1

  // Pokud jsme na začátku stránky a existuje předchozí stránka v cache
  if (prevIndex < 0 && moviesCache.value.has(currentPage.value - 1)) {
    currentPage.value--
    currentIndex.value = moviesCache.value.get(currentPage.value)!.length - 1
    // Přednačteme předchozí stránku pro plynulou navigaci
    checkAndPreload()
  }
  // Pokud jsme na začátku stránky a existuje předchozí stránka, načteme ji
  else if (prevIndex < 0 && currentPage.value > 1) {
    currentPage.value--
    query.value.page = currentPage.value
    await refreshMovies()
    currentIndex.value = moviesCount.value - 1
  }
  // Jinak normální navigace v rámci stránky
  else if (prevIndex >= 0) {
    currentIndex.value = prevIndex
    checkAndPreload()
  }
  // Pokud jsme na začátku a není předchozí stránka, zůstaneme na prvním filmu
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

const additionalInfo = computed(() => {
  const items = []

  if (currentMovie.value?.tmdbData?.genres?.length) {
    items.push(currentMovie.value.tmdbData.genres.map((genre: any) => genre.genre.name).join(', '))
  }
  if (currentMovie.value?.tmdbData?.runtime) {
    items.push(formatMinutesVerbose(currentMovie.value.tmdbData.runtime))
  }
  if (currentMovie.value?.createdAt) {
    items.push(formatDate(currentMovie.value.createdAt))
  }
  return items
})

const title = computed(() => {
  return (currentMovie.value?.tmdbData?.title || currentMovie.value?.tmdbData?.originalTitle)!
})

// Sledování změn v query parametrech pro automatické načítání
watch(query, async () => {
  try {
    // Vymažeme cache při změně query parametrů
    moviesCache.value.clear()
    paginationCache.value.clear()
    currentIndex.value = 0
    currentPage.value = 1
    await refreshMovies()
  }
  catch (error) {
    console.warn('Failed to refresh movies:', error)
  }
}, { deep: true })
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
          <SourceTopics :topics="currentMovie.topics" />
          <MediaOverview v-if="currentMovie.tmdbData?.overview" :overview="currentMovie.tmdbData.overview" />
        </div>
      </div>
      <div class="h-[72px]" />
      <!-- Indikátor stránkování -->
      <div class="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
        Stránka {{ pagination.page }} | {{ currentIndex + 1 }}/{{ moviesCount }}
        <span v-if="pagination.hasMore" class="text-green-400">• Další dostupné</span>
        <span v-if="moviesCache.has(currentPage + 1)" class="text-blue-400">• Přednačteno</span>
      </div>
    </div>
  </div>
</template>
