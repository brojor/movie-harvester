<script setup lang="ts">
import type { MediaType, SearchParams } from '../types'

const props = defineProps<{
  modelValue: SearchParams
  mediaType: MediaType
}>()
const emit = defineEmits(['update:modelValue'])
const modelValue = useVModel(props, 'modelValue', emit)

const { genreOptions } = useGenres(props.mediaType)

function onGenreChange(genreId: string) {
  modelValue.value.genreId = genreId === '' ? undefined : Number(genreId)
}
</script>

<template>
  <div class="flex gap-2 items-center">
    <IconSort class="h-6 w-6" />
    <UiSelect
      :model-value="modelValue.genreId?.toString() || ''"
      :options="genreOptions"
      @update:model-value="onGenreChange"
    />
  </div>
</template>
