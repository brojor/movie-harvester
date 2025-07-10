<script setup lang="ts">
const url = ref('')

async function addToQueue() {
  await $fetch('/api/queue/add', {
    method: 'post',
    body: { url: url.value },
  })
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold text-red-500 mb-4">
      Download Manager
    </h1>
    <div class="flex gap-2">
      <input v-model="url" type="text" class="border-1 border-gray-300 rounded-md p-2 w-lg" placeholder="Enter URL">
      <button class="bg-blue-500 text-white rounded-md p-2 border-1 border-blue-500" @click="addToQueue">
        Add to queue
      </button>
    </div>
  </div>
</template>
