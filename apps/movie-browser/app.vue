<script setup lang="ts">
import { onKeyStroke, useFullscreen } from '@vueuse/core'

const { data: movies } = await useFetch('/api/movies')
const img = useImage()
const { toggle: toggleFullscreen } = useFullscreen()

const currentIndex = ref(0)
const currentMovie = computed(() => movies.value?.[currentIndex.value])
const moviesCount = computed(() => movies.value?.length ?? 0)

onKeyStroke('ArrowDown', (e) => {
  e.preventDefault()
  currentIndex.value = (currentIndex.value + 1) % moviesCount.value
})

onKeyStroke('ArrowUp', (e) => {
  e.preventDefault()
  currentIndex.value = (currentIndex.value - 1 + moviesCount.value) % moviesCount.value
})

onKeyStroke('f', () => {
  toggleFullscreen()
})

const prefetchLinks = computed(() => {
  const nextMovie = (movies.value?.[(currentIndex.value + 1) % moviesCount.value])
  if (!nextMovie)
    return []
  const poster = img.getImage(nextMovie.posterPath, { provider: 'tmdbPoster' })
  const backdrop = img.getImage(nextMovie.backdropPath, { provider: 'tmdbBackdrop' })
  return [
    {
      rel: 'prefetch',
      href: poster.url,
      as: 'image' as const,
    },
    {
      rel: 'prefetch',
      href: backdrop.url,
      as: 'image' as const,
    },
  ]
})

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

useHead({
  link: prefetchLinks,
})
</script>

<template>
  <div v-if="currentMovie" class="text-white">
    <NuxtImg v-if="currentMovie.backdropPath" provider="tmdbBackdrop" :src="currentMovie.backdropPath" class="h-screen w-full object-cover" />
    <div class="absolute top-0 left-0 w-full h-full bg-black/70 flex items-center">
      <div class="px-[5vw] py-[10vh] flex gap-[5vw]">
        <NuxtImg provider="tmdbPoster" :src="currentMovie.posterPath" class="h-[60vh]" />
        <div class="space-y-4 max-h-[60vh] flex flex-col">
          <div class="font-bold text-lg">
            <span :class="{ 'text-gray-500': currentMovie.csfdVoteAverage < 40, 'text-blue-500': currentMovie.csfdVoteAverage < 70, 'text-red-500': currentMovie.csfdVoteAverage >= 70 }">ČSFD: {{ currentMovie.csfdVoteAverage }}%</span>
            <span class="mx-2">/</span>
            <span :class="{ 'text-gray-500': currentMovie.tmdbVoteAverage < 40, 'text-blue-500': currentMovie.tmdbVoteAverage < 70, 'text-red-500': currentMovie.tmdbVoteAverage >= 70 }">TMDB: {{ (currentMovie.tmdbVoteAverage).toFixed(0) }}%</span>
          </div>
          <h1 class="text-[2.5vw] font-bold leading-[0.8] pb-2">
            {{ `${currentMovie.title} (${currentMovie.releaseDate.split('-')[0]})` }}
          </h1>
          <h2 class="text-[1.25vw] font-bold flex items-center gap-2">
            <div :class="`i-circle-flags:${currentMovie.originalLanguage}`" />
            <span class="text-[1.25vw]">{{ currentMovie.originalTitle }}</span>
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-[1vw]">{{ currentMovie.genres.join(', ') }}</span>
            <span class="text-[1vw]">•</span>
            <span class="text-[1vw]">{{ formatMinutesVerbose(currentMovie.runtime ?? 0) }}</span>
          </div>
          <p class="text-[1.3vw] max-w-[65ch] overflow-y-auto scrollbar-hide">
            {{ currentMovie.overview }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
