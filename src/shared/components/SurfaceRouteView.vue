<script setup>
import { computed } from 'vue'
import { useSurface } from '@/shared/platform/surface'

const props = defineProps({
  webComponent: {
    type: Object,
    required: true,
  },
  mobileComponent: {
    type: Object,
    required: true,
  },
})

const { isMobileSurface } = useSurface()
const activeComponent = computed(() => (isMobileSurface.value ? props.mobileComponent : props.webComponent))
</script>

<template>
  <component :is="activeComponent" />
</template>
