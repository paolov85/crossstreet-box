<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { session, clearSession } from '../auth'

const router = useRouter()
const route = useRoute()

// Su schermi stretti i link stanno in un menu che si apre con un pulsante.
// Su schermi larghi il pulsante è nascosto dal CSS e i link sono sempre visibili.
const isMenuOpen = ref(false)

// Quando si cambia pagina il menu si richiude da solo
watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  }
)

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

      <!-- aria-expanded dice ai lettori di schermo se il menu è aperto -->
      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="isMenuOpen"
        aria-controls="nav-links"
        @click="isMenuOpen = !isMenuOpen"
      >
        {{ isMenuOpen ? 'Chiudi' : 'Menu' }}
      </button>

      <ul id="nav-links" class="nav-links" :class="{ open: isMenuOpen }">
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
  gap: 1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.brand {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.02em;
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

.nav-links a:hover {
  color: var(--color-accent);
}

/* RouterLink aggiunge da solo questa classe al link della pagina aperta */
.nav-links a.router-link-active:not(.button) {
  color: var(--color-accent);
}

.nav-links .button,
.nav-links .button:hover {
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

/* Il pulsante del menu serve solo su schermi stretti */
.menu-toggle {
  display: none;
  background: none;
  color: var(--color-light);
  border: 1px solid var(--color-light);
  border-radius: 4px;
  padding: 0.4rem 0.9rem;
}

/* Sotto i 900px: barra con nome e pulsante Menu, i link si aprono sotto
   in colonna. flex-wrap porta la lista su una riga tutta sua. */
@media (max-width: 900px) {
  .navbar-inner {
    flex-wrap: wrap;
  }

  .menu-toggle {
    display: block;
  }

  .nav-links {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    border-top: 1px solid #333333;
  }

  .nav-links.open {
    display: flex;
  }

  .nav-links li {
    width: 100%;
    padding: 0.75rem 0;
    border-bottom: 1px solid #333333;
  }

  .nav-links li:last-child {
    border-bottom: none;
  }
}
</style>
