<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiRequest } from '../api'
import { formatDate } from '../format'

const categories = ['CrossFit', 'Hyrox', 'Open Box']

const classes = ref([])

// Campi del modulo. Lo stesso modulo serve per creare e per modificare:
// editingId è null quando si crea, è l'id della lezione quando si modifica
const form = reactive({
  title: '',
  category: 'CrossFit',
  coach: '',
  startsAt: '',
  duration: 60,
  capacity: 12,
})
const editingId = ref(null)

const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function loadClasses() {
  isLoading.value = true

  try {
    classes.value = await apiRequest('/classes')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadClasses)

// Il campo <input type="datetime-local"> vuole il formato "2026-11-05T07:00"
// nell'ora locale, mentre il server manda la data in UTC.
// Costruisco il testo con le ore e i minuti locali del browser.
function toInputValue(isoDate) {
  const date = new Date(isoDate)
  const pad = (number) => String(number).padStart(2, '0')

  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

function resetForm() {
  form.title = ''
  form.category = 'CrossFit'
  form.coach = ''
  form.startsAt = ''
  form.duration = 60
  form.capacity = 12
  editingId.value = null
}

// Riempie il modulo con i dati della lezione da modificare
function startEdit(lesson) {
  form.title = lesson.title
  form.category = lesson.category
  form.coach = lesson.coach
  form.startsAt = toInputValue(lesson.starts_at)
  form.duration = lesson.duration_minutes
  form.capacity = lesson.capacity
  editingId.value = lesson.id

  errorMessage.value = ''
  successMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function saveClass() {
  errorMessage.value = ''
  successMessage.value = ''
  isSaving.value = true

  // "2026-11-05T07:00" non dice il fuso orario: new Date lo legge come ora
  // del browser, e toISOString lo trasforma in UTC. Così al server arriva
  // un'ora precisa, qualunque sia il fuso orario del server.
  const body = {
    title: form.title,
    category: form.category,
    coach: form.coach,
    starts_at: new Date(form.startsAt).toISOString(),
    duration_minutes: form.duration,
    capacity: form.capacity,
  }

  try {
    if (editingId.value === null) {
      await apiRequest('/classes', { method: 'POST', body: body })
      successMessage.value = 'Lezione creata: ' + body.title
    } else {
      await apiRequest('/classes/' + editingId.value, { method: 'PUT', body: body })
      successMessage.value = 'Lezione modificata: ' + body.title
    }

    resetForm()
    await loadClasses()
  } catch (error) {
    // Ad esempio "La data della lezione deve essere nel futuro", oppure
    // il 409 se si tolgono posti già prenotati
    errorMessage.value = error.message
  } finally {
    isSaving.value = false
  }
}

async function deleteClass(lesson) {
  const booked = lesson.capacity - lesson.available_spots
  let question = 'Vuoi eliminare ' + lesson.title + ' di ' + formatDate(lesson.starts_at) + '?'

  // Le prenotazioni si cancellano insieme alla lezione (ON DELETE CASCADE):
  // l'admin deve saperlo prima di confermare
  if (booked > 0) {
    question = question + ' Verranno cancellate anche ' + booked + ' prenotazioni.'
  }

  if (!confirm(question)) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await apiRequest('/classes/' + lesson.id, { method: 'DELETE' })

    // Se stavo modificando proprio questa lezione, svuoto il modulo
    if (editingId.value === lesson.id) {
      resetForm()
    }

    successMessage.value = 'Lezione eliminata: ' + lesson.title
    await loadClasses()
  } catch (error) {
    errorMessage.value = error.message
  }
}
</script>

<template>
  <section class="page">
    <h1>Gestione lezioni</h1>

    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <form class="class-form" @submit.prevent="saveClass">
      <h2>{{ editingId === null ? 'Nuova lezione' : 'Modifica lezione' }}</h2>

      <label>
        Titolo
        <input v-model="form.title" type="text" maxlength="100" required />
      </label>

      <label>
        Categoria
        <select v-model="form.category">
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </label>

      <label>
        Coach
        <input v-model="form.coach" type="text" maxlength="100" required />
      </label>

      <label>
        Data e ora
        <input v-model="form.startsAt" type="datetime-local" required />
      </label>

      <div class="form-row">
        <label>
          Durata (minuti)
          <input v-model.number="form.duration" type="number" min="1" max="240" required />
        </label>

        <label>
          Posti
          <input v-model.number="form.capacity" type="number" min="1" max="100" required />
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="button" :disabled="isSaving">
          {{ editingId === null ? 'Crea lezione' : 'Salva modifiche' }}
        </button>
        <button v-if="editingId !== null" type="button" class="button secondary" @click="resetForm">
          Annulla
        </button>
      </div>
    </form>

    <h2 class="list-title">Lezioni in programma</h2>

    <p v-if="isLoading">Caricamento delle lezioni...</p>
    <p v-else-if="classes.length === 0">Nessuna lezione in programma.</p>

    <ul v-else class="admin-list">
      <li
        v-for="lesson in classes"
        :key="lesson.id"
        :class="{ editing: lesson.id === editingId }"
      >
        <div>
          <strong>{{ lesson.title }}</strong> · {{ lesson.category }} · {{ lesson.coach }}
          <p>
            {{ formatDate(lesson.starts_at) }} · {{ lesson.duration_minutes }} min ·
            prenotati {{ lesson.capacity - lesson.available_spots }} su {{ lesson.capacity }}
          </p>
        </div>

        <div class="row-actions">
          <button type="button" class="button secondary" @click="startEdit(lesson)">Modifica</button>
          <button type="button" class="button danger" @click="deleteClass(lesson)">Elimina</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.message {
  margin-bottom: 1rem;
}

.class-form {
  max-width: 32rem;
  background: var(--color-surface);
  padding: 1.25rem;
  margin-bottom: 2rem;
}

.class-form h2,
.list-title {
  font-size: 1.2rem;
}

.list-title {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.admin-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  padding: 0.75rem 1rem;
}

.admin-list li.editing {
  background: #fff8d6;
}
</style>
