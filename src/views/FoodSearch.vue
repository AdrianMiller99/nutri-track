<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebFoodSearchScreen from '@/web/screens/FoodSearchScreen.vue'
import MobileFoodSearchScreen from '@/mobile/screens/FoodSearchScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebFoodSearchScreen" :mobile-component="MobileFoodSearchScreen" />
</template>
