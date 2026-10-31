<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiRequest } from '../api'
import { saveSession } from '../auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

const errorMessage = ref('')
const isSending = ref(false)

async function login() {
  errorMessage.value = ''
  isSending.value = true

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    saveSession(data.token, data.user)

    // Se la route guard aveva mandato qui l'utente, lo riporto alla pagina
    // che voleva aprire. Accetto solo indirizzi interni (che iniziano con
    // una sola /), così un link con ?redirect=https://altro-sito non
    // porta fuori dall'app.
    const redirect = route.query.redirect

    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      router.push(redirect)
    } else {
      router.push('/lezioni')
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="page form-page">
    <h1>Accedi</h1>

    <form @submit.prevent="login">
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

      <button type="submit" class="button" :disabled="isSending">
        {{ isSending ? 'Accesso in corso...' : 'Accedi' }}
      </button>

      <p>Non hai un account? <RouterLink to="/registrati" class="link">Registrati</RouterLink></p>
    </form>
  </section>
</template>
