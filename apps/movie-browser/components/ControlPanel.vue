<script setup lang="ts">
import type { MediaType, SearchParams } from '~/types'
import { useVModels } from '@vueuse/core'

const props = defineProps<{ sortOptions: SearchParams, mediaType: MediaType }>()
const emit = defineEmits(['update:sortOptions', 'update:mediaType'])
const { sortOptions, mediaType } = useVModels(props, emit)
</script>

<template>
  <header class="flex gap-2 items-center">
    <SourceControl v-model="mediaType" />
    <SortControl v-model="sortOptions" />
    <FilterControl v-model="sortOptions" :media-type="mediaType" />
  </header>
</template>
