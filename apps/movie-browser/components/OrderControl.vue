<script setup lang="ts">
import type { SearchParams } from '../types'

const props = defineProps<{ modelValue: SearchParams }>()
const emit = defineEmits(['update:modelValue'])
const modelValue = useVModel(props, 'modelValue', emit)

function changeOrder() {
  modelValue.value.order = modelValue.value.order === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <button class="rounded-md bg-white/20 p-1.5" @click="changeOrder">
    <IconAlphabeticalAsc v-if="modelValue.sortBy === 'title' && modelValue.order === 'asc'" class="h-6 w-6" />
    <IconAlphabeticalDesc v-else-if="modelValue.sortBy === 'title'" class="h-6 w-6" />
    <IconNumericAsc v-else-if="modelValue.order === 'asc'" class="h-6 w-6" />
    <IconNumericDesc v-else class="h-6 w-6" />
  </button>
</template>
