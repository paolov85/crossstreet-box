<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../api'
import { session } from '../auth'

const categories = ['CrossFit', 'Hyrox', 'Open Box']

const classes = ref([])
// Id delle lezioni già prenotate dall'utente collegato
const bookedClassIds = ref([])
// Categoria scelta nel filtro: stringa vuota = tutte
const selectedCategory = ref('')

const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
// Id della lezione che si sta prenotando, per disattivare solo quel pulsante
const bookingClassId = ref(null)

async function loadClasses() {
  isLoading.value = true
  errorMessage.value = ''

  // Il filtro lo applica il server con ?category=. encodeURIComponent
  // serve per "Open Box", che contiene uno spazio
  let path = '/classes'

  if (selectedCategory.value !== '') {
    path = path + '?category=' + encodeURIComponent(selectedCategory.value)
  }

  try {
    classes.value = await apiRequest(path)

    // Il calendario è pubblico; le prenotazioni dell'utente le chiedo solo
    // se ha fatto il login, per mostrare "Prenotata" sulle sue lezioni
    if (session.user) {
      const bookings = await apiRequest('/bookings/me')
      bookedClassIds.value = bookings.map((booking) => booking.class_id)
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadClasses)

function selectCategory(category) {
  selectedCategory.value = category
  loadClasses()
}

async function bookClass(lesson) {
  errorMessage.value = ''
  successMessage.value = ''
  bookingClassId.value = lesson.id

  try {
    await apiRequest('/bookings', { method: 'POST', body: { class_id: lesson.id } })

    // Aggiorno la pagina senza richiedere di nuovo tutto il calendario
    lesson.available_spots = lesson.available_spots - 1
    bookedClassIds.value.push(lesson.id)
    successMessage.value = 'Prenotazione confermata: ' + lesson.title + ', ' + formatDate(lesson.starts_at)
  } catch (error) {
    // Ad esempio "La lezione è al completo" se qualcuno ha preso
    // l'ultimo posto mentre la pagina era aperta: ricarico il calendario
    // per mostrare i posti aggiornati, poi il messaggio (loadClasses lo
    // azzera all'inizio)
    await loadClasses()
    errorMessage.value = error.message
  } finally {
    bookingClassId.value = null
  }
}

// Il server manda le date in UTC (es. "2026-11-01T06:00:00.000Z"):
// toLocaleString le mostra nell'ora italiana, ora legale compresa
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="page">
    <h1>Lezioni</h1>
    <p class="intro">Il calendario dei prossimi giorni, con i posti ancora liberi.</p>

    <div class="filters">
      <button
        type="button"
        :class="{ active: selectedCategory === '' }"
        @click="selectCategory('')"
      >
        Tutte
      </button>
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :class="{ active: selectedCategory === category }"
        @click="selectCategory(category)"
      >
        {{ category }}
      </button>
    </div>

    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <p v-if="isLoading">Caricamento delle lezioni...</p>
    <p v-else-if="classes.length === 0">Nessuna lezione in programma.</p>

    <ul v-else class="class-list">
      <li v-for="lesson in classes" :key="lesson.id" class="class-card">
        <div class="class-info">
          <span class="category">{{ lesson.category }}</span>
          <h2>{{ lesson.title }}</h2>
          <p class="date">{{ formatDate(lesson.starts_at) }} · {{ lesson.duration_minutes }} min</p>
          <p>Coach: {{ lesson.coach }}</p>
          <p :class="{ full: lesson.available_spots <= 0 }">
            Posti liberi: {{ lesson.available_spots }} su {{ lesson.capacity }}
          </p>
        </div>

        <div class="class-action">
          <!-- Senza login il pulsante porta alla pagina di accesso, e dopo
               il login si torna qui grazie a redirect -->
          <RouterLink
            v-if="!session.user"
            :to="{ name: 'login', query: { redirect: '/lezioni' } }"
            class="button secondary"
          >
            Accedi per prenotare
          </RouterLink>
          <span v-else-if="bookedClassIds.includes(lesson.id)" class="booked">Prenotata</span>
          <button v-else-if="lesson.available_spots <= 0" type="button" class="button" disabled>
            Al completo
          </button>
          <button
            v-else
            type="button"
            class="button"
            :disabled="bookingClassId === lesson.id"
            @click="bookClass(lesson)"
          >
            {{ bookingClassId === lesson.id ? 'Prenotazione...' : 'Prenota' }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.intro {
  margin-bottom: 1.25rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.filters button {
  background: var(--color-surface);
  border: 1px solid #cccccc;
  border-radius: 999px;
  padding: 0.35rem 1rem;
}

.filters button.active {
  background: var(--color-dark);
  border-color: var(--color-dark);
  color: var(--color-light);
}

.message {
  margin-bottom: 1rem;
}

.class-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.class-card {
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
  color: #666666;
}

.class-info h2 {
  font-size: 1.2rem;
}

.date {
  font-weight: 600;
}

.full {
  color: #9b1c1c;
  font-weight: 600;
}

.booked {
  font-weight: 700;
  color: #1e5e34;
}

.button.secondary {
  background: var(--color-dark);
  color: var(--color-light);
}
</style>
