<script setup lang="ts">
import type { Threads } from './types'
import { useWebSocket } from '@vueuse/core'

const url = ref('')

async function addToQueue() {
  await $fetch('/api/queue/add', {
    method: 'post',
    body: { url: url.value },
  })
}

const { data } = useWebSocket(`ws://192.168.1.102:3001/api/websocket`)
const threads = computed(() => {
  return JSON.parse(data.value) as Threads
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-5">
    <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 max-w-4xl w-full">
      <h1 class="text-2xl font-bold text-red-500 mb-4">
        Download Manager
      </h1>
      <div class="flex gap-2 mb-4">
        <input v-model="url" type="text" class="border-1 border-gray-300 rounded-md p-2 w-lg" placeholder="Enter URL">
        <button class="bg-blue-500 text-white rounded-md p-2 border-1 border-blue-500" @click="addToQueue">
          Add to queue
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ThreadCard v-for="thread in threads" :key="thread.id" :thread="thread" />
      </div>
    </div>
  </div>
</template>
