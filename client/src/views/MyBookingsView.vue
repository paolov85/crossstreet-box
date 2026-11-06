<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'
import { formatDate } from '../format'

const bookings = ref([])

const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
// Id della prenotazione che si sta disdicendo, per disattivare solo quel pulsante
const cancellingId = ref(null)

// La pagina è riservata (requiresAuth nel router): qui l'utente ha
// sempre fatto il login, e il server restituisce solo le sue prenotazioni
async function loadBookings() {
  isLoading.value = true

  try {
    bookings.value = await apiRequest('/bookings/me')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBookings)

async function cancelBooking(booking) {
  // confirm apre la finestra del browser con OK e Annulla:
  // la disdetta libera il posto, meglio chiedere prima
  if (!confirm('Vuoi disdire ' + booking.title + ' di ' + formatDate(booking.starts_at) + '?')) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  cancellingId.value = booking.id

  try {
    await apiRequest('/bookings/' + booking.id, { method: 'DELETE' })

    // Tolgo la prenotazione dalla lista senza ricaricarla
    bookings.value = bookings.value.filter((item) => item.id !== booking.id)
    successMessage.value = 'Prenotazione disdetta: ' + booking.title
  } catch (error) {
    // Ad esempio "La lezione è già iniziata": ricarico la lista per
    // mostrare la situazione aggiornata, poi il messaggio
    await loadBookings()
    errorMessage.value = error.message
  } finally {
    cancellingId.value = null
  }
}
</script>

<template>
  <section class="page">
    <h1>Le mie prenotazioni</h1>

    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <p v-if="isLoading">Caricamento delle prenotazioni...</p>

    <div v-else-if="bookings.length === 0" class="empty">
      <p>Non hai lezioni in programma.</p>
      <RouterLink to="/lezioni" class="button">Prenota una lezione</RouterLink>
    </div>

    <ul v-else class="booking-list">
      <li v-for="booking in bookings" :key="booking.id" class="booking-card">
        <div>
          <span class="category">{{ booking.category }}</span>
          <h2>{{ booking.title }}</h2>
          <p class="date">{{ formatDate(booking.starts_at) }} · {{ booking.duration_minutes }} min</p>
          <p>Coach: {{ booking.coach }}</p>
        </div>

        <button
          type="button"
          class="button danger"
          :disabled="cancellingId === booking.id"
          @click="cancelBooking(booking)"
        >
          {{ cancellingId === booking.id ? 'Disdetta...' : 'Disdici' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.message {
  margin-bottom: 1rem;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.booking-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-surface);
  border-left: 4px solid var(--color-accent);
  padding: 1rem 1.25rem;
}

.category {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
}

.booking-card h2 {
  font-size: 1.2rem;
}

.date {
  font-weight: 600;
}
</style>
