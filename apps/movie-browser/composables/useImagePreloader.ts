interface MediaItem {
  tmdb: {
    posterPath: string | null
    backdropPath: string | null
  }
}

export function useImagePreloader(nextItem: Ref<MediaItem | undefined>): void {
  const img = useImage()

  const prefetchLinks = computed(() => {
    if (!nextItem.value)
      return []
    const poster = img.getImage(nextItem.value.tmdb.posterPath ?? '', { provider: 'tmdbPoster' })
    const backdrop = img.getImage(nextItem.value.tmdb.backdropPath ?? '', { provider: 'tmdbBackdrop' })
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

  useHead({
    link: prefetchLinks,
  })
}
