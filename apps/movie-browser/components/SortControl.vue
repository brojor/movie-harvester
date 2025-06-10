<script setup lang="ts">
import type { SearchParams } from '../types'
import { RATING_SOURCE_OPTIONS, SORT_BY_OPTIONS } from '../types'

const props = defineProps<{ modelValue: SearchParams }>()
const emit = defineEmits(['update:modelValue'])
const modelValue = useVModel(props, 'modelValue', emit)
</script>

<template>
  <div class="flex gap-2 items-center">
    <IconSort class="h-6 w-6" />
    <UiSelect v-model="modelValue.sortBy" :options="SORT_BY_OPTIONS" />
    <UiSelect v-if="modelValue.sortBy === 'rating'" v-model="modelValue.ratingSource" :options="RATING_SOURCE_OPTIONS" />
    <OrderControl v-model="modelValue" />
  </div>
</template>
