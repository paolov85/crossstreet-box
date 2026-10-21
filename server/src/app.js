const express = require('express')
const authRoutes = require('./routes/auth')
const classesRoutes = require('./routes/classes')

const app = express()

// Permette di leggere il corpo JSON delle richieste
app.use(express.json())

// Rotta di prova per controllare che il server risponda
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/classes', classesRoutes)

// Nessuna delle rotte qui sopra ha risposto: l'indirizzo non esiste
app.use((req, res) => {
  res.status(404).json({ error: 'Risorsa non trovata' })
})

// Gestore centralizzato degli errori. Si riconosce dai quattro parametri:
// Express manda qui tutto quello che va storto nelle rotte, comprese le
// funzioni async che falliscono.
app.use((error, req, res, next) => {
  // Corpo della richiesta che non è JSON valido: colpa di chi chiama
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Il corpo della richiesta non è JSON valido' })
  }

  // Tutto il resto è un problema nostro: lo scrivo nei log del server e
  // all'utente mando solo un messaggio generico, senza dettagli interni
  console.log('Errore non previsto: ' + error.message)
  res.status(500).json({ error: 'Errore interno del server' })
})

module.exports = app
