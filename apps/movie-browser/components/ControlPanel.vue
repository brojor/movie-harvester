<script setup lang="ts">
import type { SearchParams } from '~/types'
import { useVModels } from '@vueuse/core'

const props = defineProps<{ sortOptions: SearchParams }>()
const emit = defineEmits(['update:sortOptions'])
const { sortOptions } = useVModels(props, emit)
</script>

<template>
  <header class="flex gap-2 items-center">
    <SortControl v-model="sortOptions" />
  </header>
</template>
