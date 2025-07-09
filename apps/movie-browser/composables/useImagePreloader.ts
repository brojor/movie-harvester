interface MediaItem {
  tmdbData: {
    posterPath: string | null
    backdropPath: string | null
    networks: {
      network: {
        logoPath: string | null
      } | null
    }[]
  } | null
}

export function useImagePreloader(nextItem: Ref<MediaItem | undefined>): void {
  const img = useImage()

  const prefetchLinks = computed(() => {
    if (!nextItem.value?.tmdbData)
      return []
    const poster = img.getImage(nextItem.value.tmdbData.posterPath ?? '', { provider: 'tmdbPoster' })
    const backdrop = img.getImage(nextItem.value.tmdbData.backdropPath ?? '', { provider: 'tmdbBackdrop' })
    const networkLogo = img.getImage(nextItem.value.tmdbData.networks?.[0]?.network?.logoPath ?? '', { provider: 'tmdbNetwork' })
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
      {
        rel: 'prefetch',
        href: networkLogo.url,
        as: 'image' as const,
      },
    ]
  })

  useHead({
    link: prefetchLinks,
  })
}
