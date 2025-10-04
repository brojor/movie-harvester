export function useOptimisticUpdate(timeout = 3000): { update: (id: string, optimistic: () => void, rollback: () => void) => void, confirm: (id: string) => void, isPending: (id: string) => boolean } {
  const pending = shallowRef<Map<string, () => void>>(new Map())

  function update(id: string, optimistic: () => void, rollback: () => void): void {
    optimistic()

    const existing = pending.value.get(id)
    if (existing) {
      existing()
    }

    const timeoutId = setTimeout(() => {
      rollback()
      pending.value.delete(id)
    }, timeout)

    pending.value.set(id, () => {
      clearTimeout(timeoutId)
      pending.value.delete(id)
    })
  }

  function confirm(id: string): void {
    const cleanup = pending.value.get(id)
    if (cleanup) {
      cleanup()
    }
  }

  function isPending(id: string): boolean {
    return pending.value.has(id)
  }

  onUnmounted(() => {
    for (const cleanup of pending.value.values()) {
      cleanup()
    }
    pending.value.clear()
  })

  return { update, confirm, isPending }
}
