<script setup>
import { onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { apiRequest, requestStatus } from './api'
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
      // expired fa mostrare alla pagina di accesso il motivo del rimando
      router.push({ name: 'login', query: { redirect: route.fullPath, expired: '1' } })
    }
  }
)
</script>

<template>
  <NavBar />

  <!-- role="status" fa leggere l'avviso ai lettori di schermo -->
  <p v-if="requestStatus.slowCount > 0" class="slow-banner" role="status">
    Il server si sta avviando dopo un periodo di inattività: può volerci fino a un minuto.
  </p>

  <main class="container">
    <!-- Qui il router mostra la pagina che corrisponde all'indirizzo -->
    <RouterView />
  </main>
</template>

<style scoped>
.slow-banner {
  background: var(--color-accent);
  color: var(--color-dark);
  font-weight: 600;
  text-align: center;
  padding: 0.6rem 1rem;
}
</style>
