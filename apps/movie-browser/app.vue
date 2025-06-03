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
  const poster = img.getImage(nextMovie.tmdb.posterPath ?? '', { provider: 'tmdbPoster' })
  const backdrop = img.getImage(nextMovie.tmdb.backdropPath ?? '', { provider: 'tmdbBackdrop' })
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
    <NuxtImg v-if="currentMovie.tmdb.backdropPath" provider="tmdbBackdrop" :src="currentMovie.tmdb.backdropPath" class="h-screen w-full object-cover" />
    <div class="absolute top-0 left-0 w-full h-full bg-black/70 flex items-center">
      <div class="px-[5vw] py-[10vh] flex gap-[5vw]">
        <NuxtImg v-if="currentMovie.tmdb.posterPath" provider="tmdbPoster" :src="currentMovie.tmdb.posterPath" class="h-[60vh]" />
        <div class="space-y-4 max-h-[60vh] flex flex-col">
          <div class="font-bold text-lg">
            <span v-if="currentMovie.csfd?.voteAverage" :class="{ 'text-gray-500': currentMovie.csfd.voteAverage < 40, 'text-blue-500': currentMovie.csfd.voteAverage < 70, 'text-red-500': currentMovie.csfd.voteAverage >= 70 }">ČSFD: {{ currentMovie.csfd.voteAverage }}%</span>
            <span class="mx-2">/</span>
            <span v-if="currentMovie.tmdb.voteAverage" :class="{ 'text-gray-500': currentMovie.tmdb.voteAverage * 10 < 40, 'text-blue-500': currentMovie.tmdb.voteAverage * 10 < 70, 'text-red-500': currentMovie.tmdb.voteAverage * 10 >= 70 }">TMDB: {{ (currentMovie.tmdb.voteAverage * 10).toFixed(0) }}%</span>
            <template v-if="currentMovie.rt?.criticsScore">
              <span class="mx-2">/</span>
              <span v-if="currentMovie.rt?.criticsScore" :class="{ 'text-gray-500': currentMovie.rt.criticsScore < 40, 'text-blue-500': currentMovie.rt.criticsScore < 70, 'text-red-500': currentMovie.rt.criticsScore >= 70 }">RT: {{ currentMovie.rt.criticsScore }}%</span>
            </template>
          </div>
          <h1 class="text-[2.5vw] font-bold leading-[0.8] pb-2">
            {{ `${currentMovie.movie.czechTitle} (${currentMovie.movie.year})` }}
          </h1>
          <h2 class="text-[1.25vw] font-bold flex items-center gap-2">
            <div :class="`i-circle-flags:${currentMovie.tmdb.originalLanguage}`" />
            <span class="text-[1.25vw]">{{ currentMovie.tmdb.originalTitle }}</span>
          </h2>
          <div class="flex items-center gap-2">
            <span class="text-[1vw]">{{ currentMovie.tmdbGenres.join(', ') }}</span>
            <span class="text-[1vw]">•</span>
            <span class="text-[1vw]">{{ formatMinutesVerbose(currentMovie.tmdb.runtime ?? 0) }}</span>
          </div>
          <p class="text-[1.3vw] max-w-[65ch] overflow-y-auto scrollbar-hide">
            {{ currentMovie.tmdb.overview }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
