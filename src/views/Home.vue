<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebHomeScreen from '@/web/screens/HomeScreen.vue'
import MobileHomeScreen from '@/mobile/screens/HomeScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebHomeScreen" :mobile-component="MobileHomeScreen" />
</template>
