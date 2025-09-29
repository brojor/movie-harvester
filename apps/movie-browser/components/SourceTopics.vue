<script setup lang="ts">
import type { MovieTopic, TvShowTopic } from '@repo/database'

defineProps<{ topics: MovieTopic[] | TvShowTopic[] }>()
</script>

<template>
  <div class="flex gap-2">
    <div v-for="topic in topics" :key="topic.id" class="bg-gray-800 rounded-md p-2">
      <NuxtLink :to="`http://www.warforum.xyz/viewtopic.php?t=${topic.topicId}`" target="_blank" class="text-white">
        {{ topic.topicType }}
        <span v-if="'languages' in topic && topic.languages.length" class="text-gray-400">({{ topic.languages.join(', ') }})</span>
      </NuxtLink>
    </div>
  </div>
</template>
