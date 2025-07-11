<script setup lang="ts">
import type { Threads } from './types'
import { useWebSocket } from '@vueuse/core'

const textareaContent = ref('')

async function addToQueue() {
  const urls = extractWebshareUrls(textareaContent.value)

  await $fetch('/api/queue/bulk', {
    method: 'post',
    body: { urls },
  })

  textareaContent.value = ''
}
function extractWebshareUrls(text: string): string[] {
  const regex = /https:\/\/webshare\.cz\/#\/file\/\S+/g
  const matches = text.match(regex)
  return matches ?? []
}

const { data } = useWebSocket(`ws://192.168.1.102:3001/api/websocket`)
const threads = computed(() => {
  return JSON.parse(data.value) as Threads
})

const textarea = ref<HTMLTextAreaElement | null>(null)

function resizeTextarea() {
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${textarea.value.scrollHeight}px`
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-5">
    <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 max-w-4xl w-full">
      <h1 class="text-2xl font-bold text-white mb-4">
        Download Manager
      </h1>
      <div class="flex gap-2 mb-4">
        <textarea
          ref="textarea" v-model="textareaContent" placeholder="Enter URL"
          class="rounded-md p-2 w-full bg-white/10 text-white/70 focus:outline-none focus:ring-1 focus:ring-white/20"
          @input="resizeTextarea" @keydown.enter.prevent="addToQueue"
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ThreadCard v-for="thread in threads" :key="thread.id" :thread="thread" />
      </div>
    </div>
  </div>
</template>
