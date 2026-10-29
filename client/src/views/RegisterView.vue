<script setup>
import { ref } from 'vue'
import { apiRequest } from '../api'

const name = ref('')
const email = ref('')
const password = ref('')

const errorMessage = ref('')
const registeredName = ref('')
// Blocca il pulsante mentre la richiesta è in corso, così un doppio clic
// non manda due registrazioni
const isSending = ref(false)

async function register() {
  errorMessage.value = ''

  // Gli stessi controlli li fa il server: qui servono solo a dare subito
  // un messaggio, senza aspettare la risposta. La sicurezza resta sul server.
  if (password.value.length < 8) {
    errorMessage.value = 'La password deve avere almeno 8 caratteri'
    return
  }

  isSending.value = true

  try {
    const user = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value },
    })

    registeredName.value = user.name
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="page form-page">
    <h1>Registrati</h1>

    <div v-if="registeredName" class="message success">
      <p>Benvenuto, {{ registeredName }}! Il tuo account è pronto.</p>
      <RouterLink to="/accedi" class="button">Accedi</RouterLink>
    </div>

    <form v-else @submit.prevent="register">
      <label>
        Nome
        <input v-model="name" type="text" maxlength="100" required autocomplete="name" />
      </label>

      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required autocomplete="new-password" />
        <small>Almeno 8 caratteri</small>
      </label>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

      <button type="submit" class="button" :disabled="isSending">
        {{ isSending ? 'Invio in corso...' : 'Crea account' }}
      </button>

      <p>Hai già un account? <RouterLink to="/accedi" class="link">Accedi</RouterLink></p>
    </form>
  </section>
</template>
