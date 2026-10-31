<script setup>
import { onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { apiRequest } from './api'
import { session, updateUser, clearSession } from './auth'

const router = useRouter()
const route = useRoute()

// All'apertura dell'app chiedo al server chi è l'utente del token salvato.
// Così i dati mostrati sono aggiornati (ad esempio se nel frattempo è
// diventato admin) e, se il token è scaduto, apiRequest chiude la sessione.
onMounted(async () => {
  if (!session.token) {
    return
  }

  try {
    const user = await apiRequest('/auth/me')
    updateUser(user)
  } catch (error) {
    // 404: il token è valido ma l'utente è stato eliminato.
    // Se invece il server non risponde lascio la sessione com'è.
    if (error.status === 404) {
      clearSession()
    }
  }
})

// Se la sessione si chiude mentre si è su una pagina riservata
// (token scaduto), riporto l'utente alla pagina di accesso
watch(
  () => session.user,
  (user) => {
    if (user === null && route.meta.requiresAuth) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
    }
  }
)
</script>

<template>
  <NavBar />

  <main class="container">
    <!-- Qui il router mostra la pagina che corrisponde all'indirizzo -->
    <RouterView />
  </main>
</template>
