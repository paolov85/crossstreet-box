<script setup>
import { useRouter } from 'vue-router'
import { session, clearSession } from '../auth'

const router = useRouter()

// Prima esco dalla pagina, poi chiudo la sessione: se lo facessi al
// contrario e si fosse su una pagina riservata, App.vue rimanderebbe
// alla pagina di accesso invece che alla home
async function logout() {
  await router.push('/')
  clearSession()
}
</script>

<template>
  <header class="navbar">
    <nav class="container navbar-inner">
      <RouterLink to="/" class="brand">CrossStreet <span>Box</span></RouterLink>

      <ul class="nav-links">
        <li><RouterLink to="/lezioni">Lezioni</RouterLink></li>

        <!-- I link cambiano a seconda che l'utente sia collegato o no -->
        <template v-if="session.user">
          <li><RouterLink to="/prenotazioni">Le mie prenotazioni</RouterLink></li>
          <li v-if="session.user.role === 'admin'"><RouterLink to="/admin">Admin</RouterLink></li>
          <li class="user-name">Ciao, {{ session.user.name }}</li>
          <li><button type="button" class="logout" @click="logout">Esci</button></li>
        </template>
        <template v-else>
          <li><RouterLink to="/accedi">Accedi</RouterLink></li>
          <li><RouterLink to="/registrati" class="button">Registrati</RouterLink></li>
        </template>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  background: var(--color-dark);
  color: var(--color-light);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Su schermi stretti i link vanno sotto il nome invece di uscire dallo schermo */
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.brand {
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-light);
}

.brand span {
  color: var(--color-accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  list-style: none;
}

.nav-links a {
  color: var(--color-light);
}

/* RouterLink aggiunge da solo questa classe al link della pagina aperta */
.nav-links a.router-link-active:not(.button) {
  color: var(--color-accent);
}

.nav-links .button {
  color: var(--color-dark);
}
.user-name {
  color: #bbbbbb;
}

.logout {
  background: none;
  color: var(--color-light);
  border: 1px solid var(--color-light);
  border-radius: 4px;
  padding: 0.4rem 0.9rem;
}
</style>
