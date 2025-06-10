<script setup lang="ts">
import type { MediaType } from '~/types'
import { useVModel } from '@vueuse/core'
import { MEDIA_TYPE_OPTIONS } from '~/types'

const props = defineProps<{ modelValue: MediaType }>()
const emit = defineEmits(['update:modelValue'])
const modelValue = useVModel(props, 'modelValue', emit)
</script>

<template>
  <IconCinema class="h-6 w-6" />
  <UiSelect v-model="modelValue" :options="MEDIA_TYPE_OPTIONS" />
</template>
