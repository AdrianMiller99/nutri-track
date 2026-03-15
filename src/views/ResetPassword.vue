<script setup>
import SurfaceRouteView from '@/shared/components/SurfaceRouteView.vue'
import WebResetPasswordScreen from '@/web/screens/ResetPasswordScreen.vue'
import MobileResetPasswordScreen from '@/mobile/screens/ResetPasswordScreen.vue'
</script>

<template>
  <SurfaceRouteView :web-component="WebResetPasswordScreen" :mobile-component="MobileResetPasswordScreen" />
</template>
