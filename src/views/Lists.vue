<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebListsScreen from '@/web/screens/ListsScreen.vue'
import MobileListsScreen from '@/mobile/screens/ListsScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebListsScreen" :mobile-component="MobileListsScreen" />
</template>
