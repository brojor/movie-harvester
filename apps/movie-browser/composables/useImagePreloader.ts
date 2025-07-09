interface MediaItem {
  tmdbData: {
    posterPath: string | null
    backdropPath: string | null
  } | null
}

export function useImagePreloader(nextItem: Ref<MediaItem | undefined>): void {
  const img = useImage()

  const prefetchLinks = computed(() => {
    if (!nextItem.value?.tmdbData)
      return []
    const poster = img.getImage(nextItem.value.tmdbData.posterPath ?? '', { provider: 'tmdbPoster' })
    const backdrop = img.getImage(nextItem.value.tmdbData.backdropPath ?? '', { provider: 'tmdbBackdrop' })
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
