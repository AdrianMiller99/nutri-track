<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <h1>Welcome to Nutri Track</h1>
  <p>
    <button @click="router.push('/auth')">Sign In</button>
    <button @click="router.push('/auth')">Sign Up</button>
  </p>
</template>

<style scoped></style>