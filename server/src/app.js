const express = require('express')

const app = express()

// Permette di leggere il body JSON delle richieste
app.use(express.json())

// Rotta di prova per controllare che il server risponda
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = app
