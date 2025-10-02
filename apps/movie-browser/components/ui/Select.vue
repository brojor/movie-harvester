<script setup lang="ts" generic="Item extends { label: string, value: string }, ValueType extends Item['value']">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'

const props = defineProps<{ modelValue: ValueType, options: readonly Item[] }>()

const emit = defineEmits(['update:modelValue'])

const modelValue = useVModel(props, 'modelValue', emit)

const label = computed<Item['label']>(() => {
  const option = props.options.find(option => option.value === modelValue.value)
  return option?.label || ''
})
</script>

<template>
  <Listbox v-slot="{ open }" v-model="modelValue">
    <div class="relative w-[150px]">
      <ListboxButton
        class="relative w-full cursor-default rounded-lg bg-white/20 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none
       focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2
       focus-visible:ring-offset-orange-300 sm:text-sm"
      >
        <span class="block truncate font-semibold">{{ label }}</span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <IconChevronDown :class="{ 'rotate-180': open }" />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5
           focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="option in options"
            v-slot="{ active, selected }"
            :key="option.value"
            :value="option.value"
            as="template"
          >
            <li
              class="relative cursor-default select-none py-2 pl-10 pr-4"
              :class="[active ? 'bg-amber-100 text-amber-900' : 'text-gray-900']"
            >
              <span class="block truncate" :class="[selected ? 'font-medium' : 'font-normal']">{{ option.label }}</span>
              <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600" />
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
