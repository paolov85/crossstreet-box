<script setup>
// Per ora i link sono sempre gli stessi. Quando ci sarà il login la barra
// mostrerà link diversi a seconda che l'utente sia collegato o no.
</script>

<template>
  <header class="navbar">
    <nav class="container navbar-inner">
      <RouterLink to="/" class="brand">CrossStreet <span>Box</span></RouterLink>

      <ul class="nav-links">
        <li><RouterLink to="/lezioni">Lezioni</RouterLink></li>
        <li><RouterLink to="/accedi">Accedi</RouterLink></li>
        <li><RouterLink to="/registrati" class="button">Registrati</RouterLink></li>
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
</style>
