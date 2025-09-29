import type { Genre } from '~/types'

export function useGenres(type: 'movie' | 'tv-show'): {
  genres: Readonly<Ref<readonly Genre[] | null>>
  genreOptions: ComputedRef<Array<{ label: string, value: string }>>
  error: Readonly<Ref<Error | null>>
  pending: Readonly<Ref<boolean>>
} {
  const { data: genres, error, pending } = useFetch<Genre[]>('/api/genres', {
    query: { type },
    key: `genres-${type}`,
  })

  const genreOptions = computed(() => [
    { label: 'Všechny žánry', value: '' },
    ...(genres.value || []).map(genre => ({
      label: genre.name,
      value: genre.id.toString(),
    })),
  ])

  return {
    genres: readonly(genres),
    genreOptions,
    error,
    pending,
  }
}
