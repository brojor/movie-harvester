// composables/usePageCache.ts
import type { PageCache } from '../types'

export function usePageCache<T>(
  keyFor: (page: number) => string,
  fetcher: (page: number) => Promise<T>,
): PageCache<T> {
  const value = shallowRef<T | null>(null)

  async function loadPage(page: number, opts: { activate?: boolean } = {}): Promise<void> {
    if (page < 1)
      return
    const key = keyFor(page)
    const store = useNuxtData<T>(key)

    if (!store.data.value) {
      const res = await fetcher(page)
      store.data.value = res
    }
    if (opts.activate)
      value.value = store.data.value!
  }

  // reaktivní náhled do cache (bez aktivace do UI)
  function peekPage(page: number): Ref<T | null> {
    const key = keyFor(page)
    return useNuxtData<T>(key).data
  }

  return { value, loadPage, peekPage }
}
