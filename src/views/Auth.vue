<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebAuthScreen from '@/web/screens/AuthScreen.vue'
import MobileAuthScreen from '@/mobile/screens/AuthScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebAuthScreen" :mobile-component="MobileAuthScreen" />
</template>
