<script setup lang="ts">
const props = defineProps<{
  url: string
}>()

function extractIdent(webshareFileUrl: string): string {
  const match = webshareFileUrl.match(/file\/([^/]+)/)
  if (!match)
    throw new Error('Could not extract identifier from URL')

  return match[1]
}

function extractFilename(downloadLink: string): string {
  const filename = downloadLink?.split('/').pop()
  if (!filename) {
    throw new Error('Could not extract filename from download link')
  }

  return filename
}

const { data, pending } = useFetch('/api/links/check', {
  method: 'post',
  body: { ident: extractIdent(props.url) },
})

const state = computed<'alive' | 'dead' | 'unknown'>(() => {
  if (!pending.value && !data.value) {
    return 'unknown'
  }
  if (data.value?.exists) {
    return 'alive'
  }
  return 'dead'
})

defineExpose({
  state,
  url: props.url,
})
</script>

<template>
  <div class="flex items-center justify-between px-5">
    <div>
      <template v-if="pending">
        <IconSpinner class="w-3 h-3 animate-spin text-yellow-500 inline-block mr-2" />
      </template>

      <template v-else>
        <IconCheckCircle v-if="state === 'alive'" class="w-3 h-3 text-green-500 inline-block mr-2" />
        <IconCancel v-if="state === 'dead'" class="w-3 h-3 text-red-500 inline-block mr-2" />
        <IconQuestionMark v-if="state === 'unknown'" class="w-3 h-3 text-white/80 inline-block mr-2" />
      </template>

      <span class="text-sm text-white/80">{{ extractFilename(url) }}</span>
    </div>
  </div>
</template>
