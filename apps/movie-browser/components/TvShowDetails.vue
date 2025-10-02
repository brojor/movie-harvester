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
const currentPage = ref(1)
const pageSize = 20

// Cache pro načtené stránky
const tvShowsCache = ref<Map<number, any[]>>(new Map())
const paginationCache = ref<Map<number, any>>(new Map())

const query = ref<SearchParams>({
  sortBy: 'title',
  ratingSource: 'csfd',
  order: 'asc',
  page: currentPage.value,
  limit: pageSize,
})

const { data: tvShowsResponse, refresh: refreshTvShows } = await useFetch('/api/tv-shows', { query })

// Uložíme první stránku do cache
watch(tvShowsResponse, (newResponse) => {
  if (newResponse?.data && newResponse?.pagination) {
    tvShowsCache.value.set(currentPage.value, newResponse.data)
    paginationCache.value.set(currentPage.value, newResponse.pagination)
  }
}, { immediate: true })

const tvShows = computed(() => tvShowsCache.value.get(currentPage.value) ?? [])
const pagination = computed(() => paginationCache.value.get(currentPage.value) ?? { page: 1, limit: pageSize, total: 0, hasMore: false })

const currentTvShow = computed(() => tvShows.value?.[currentIndex.value])
const tvShowsCount = computed(() => tvShows.value?.length ?? 0)

// Správná logika pro nextTvShow - zohledňuje přechody mezi stránkami
const nextTvShow = computed(() => {
  const nextIndex = currentIndex.value + 1

  // Pokud je další seriál na stejné stránce
  if (nextIndex < tvShowsCount.value) {
    return tvShows.value?.[nextIndex]
  }

  // Pokud je další seriál na další stránce (pokud existuje v cache)
  if (tvShowsCache.value.has(currentPage.value + 1)) {
    const nextPageTvShows = tvShowsCache.value.get(currentPage.value + 1) ?? []
    return nextPageTvShows[0]
  }

  // Pokud je další seriál na další stránce (pokud existuje další stránka)
  if (pagination.value.hasMore) {
    return null // Bude načteno při přechodu
  }

  // Pokud jsme na konci, vraťme první seriál ze současné stránky
  return tvShows.value?.[0]
})

useImagePreloader(nextTvShow)

// Funkce pro přednačítání stránky
async function preloadPage(pageNumber: number) {
  if (tvShowsCache.value.has(pageNumber)) {
    return // Stránka už je v cache
  }

  try {
    const response = await $fetch('/api/tv-shows', {
      query: {
        ...query.value,
        page: pageNumber,
      },
    })

    if (response?.data && response?.pagination) {
      tvShowsCache.value.set(pageNumber, response.data)
      paginationCache.value.set(pageNumber, response.pagination)
    }
  }
  catch (error) {
    console.warn(`Failed to preload page ${pageNumber}:`, error)
  }
}

// Funkce pro detekci blížení se ke konci stránky
function checkAndPreload() {
  const remainingItems = tvShowsCount.value - currentIndex.value - 1
  const preloadThreshold = 3 // Přednačteme, když zbývají 3 nebo méně položek

  // Přednačteme další stránku, pokud se blížíme ke konci
  if (remainingItems <= preloadThreshold && pagination.value.hasMore) {
    const nextPage = currentPage.value + 1
    if (!tvShowsCache.value.has(nextPage)) {
      preloadPage(nextPage)
    }
  }

  // Přednačteme předchozí stránku, pokud jsme na začátku a existuje
  if (currentIndex.value <= preloadThreshold && currentPage.value > 1) {
    const prevPage = currentPage.value - 1
    if (!tvShowsCache.value.has(prevPage)) {
      preloadPage(prevPage)
    }
  }
}

async function incrementIndex() {
  const nextIndex = currentIndex.value + 1

  // Pokud jsme na konci stránky a existuje další stránka v cache
  if (nextIndex >= tvShowsCount.value && tvShowsCache.value.has(currentPage.value + 1)) {
    currentPage.value++
    currentIndex.value = 0
    // Přednačteme další stránku pro plynulou navigaci
    checkAndPreload()
    // Spustíme přednačítání obrázků pro novou stránku
    await nextTick()
  }
  // Pokud jsme na konci stránky a existuje další stránka, načteme ji
  else if (nextIndex >= tvShowsCount.value && pagination.value.hasMore) {
    currentPage.value++
    query.value.page = currentPage.value
    currentIndex.value = 0
    await refreshTvShows()
    // Spustíme přednačítání obrázků pro novou stránku
    await nextTick()
  }
  // Jinak normální navigace v rámci stránky
  else if (nextIndex < tvShowsCount.value) {
    currentIndex.value = nextIndex
    checkAndPreload()
  }
  // Pokud jsme na konci a není další stránka, zůstaneme na posledním seriálu
}

async function decrementIndex() {
  const prevIndex = currentIndex.value - 1

  // Pokud jsme na začátku stránky a existuje předchozí stránka v cache
  if (prevIndex < 0 && tvShowsCache.value.has(currentPage.value - 1)) {
    currentPage.value--
    currentIndex.value = tvShowsCache.value.get(currentPage.value)!.length - 1
    // Přednačteme předchozí stránku pro plynulou navigaci
    checkAndPreload()
    // Spustíme přednačítání obrázků pro novou stránku
    await nextTick()
  }
  // Pokud jsme na začátku stránky a existuje předchozí stránka, načteme ji
  else if (prevIndex < 0 && currentPage.value > 1) {
    currentPage.value--
    query.value.page = currentPage.value
    await refreshTvShows()
    currentIndex.value = tvShowsCount.value - 1
    // Spustíme přednačítání obrázků pro novou stránku
    await nextTick()
  }
  // Jinak normální navigace v rámci stránky
  else if (prevIndex >= 0) {
    currentIndex.value = prevIndex
    checkAndPreload()
  }
  // Pokud jsme na začátku a není předchozí stránka, zůstaneme na prvním seriálu
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

// Sledování změn v query parametrech pro automatické načítání
watch(query, async () => {
  try {
    // Vymažeme cache při změně query parametrů
    tvShowsCache.value.clear()
    paginationCache.value.clear()
    currentIndex.value = 0
    currentPage.value = 1
    await refreshTvShows()
  } catch (error) {
    console.warn('Failed to refresh tv shows:', error)
  }
}, { deep: true })
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
      <!-- Indikátor stránkování -->
      <div class="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
        Stránka {{ pagination.page }} | {{ currentIndex + 1 }}/{{ tvShowsCount }}
        <span v-if="pagination.hasMore" class="text-green-400">• Další dostupné</span>
        <span v-if="tvShowsCache.has(currentPage + 1)" class="text-blue-400">• Přednačteno</span>
      </div>
    </div>
  </div>
</template>
