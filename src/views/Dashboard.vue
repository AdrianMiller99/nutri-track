<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebDashboardScreen from '@/web/screens/DashboardScreen.vue'
import MobileDashboardScreen from '@/mobile/screens/DashboardScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebDashboardScreen" :mobile-component="MobileDashboardScreen" />
</template>
