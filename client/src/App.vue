<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />

  <main class="container">
    <!-- Qui il router mostra la pagina che corrisponde all'indirizzo -->
    <RouterView />
  </main>
</template>
