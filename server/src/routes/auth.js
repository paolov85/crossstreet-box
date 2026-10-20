const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { validText, validEmail, validPassword } = require('../validation')

const router = express.Router()

// Registrazione di un nuovo utente
router.post('/register', async (req, res) => {
  // Senza corpo nella richiesta req.body resta undefined, quindi lo controllo
  // prima di leggerne i campi
  const body = req.body

  if (!body) {
    return res.status(400).json({ error: 'Manca il corpo della richiesta' })
  }

  const name = validText(body.name, 100)
  const email = validEmail(body.email)
  const password = validPassword(body.password)

  if (name === null) {
    return res.status(400).json({ error: 'Il nome deve essere un testo da 1 a 100 caratteri' })
  }

  if (email === null) {
    return res.status(400).json({ error: 'L\'email non è valida' })
  }

  if (password === null) {
    return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' })
  }

  // L'email è unica nel database: controllo prima di inserire, così posso
  // rispondere con un messaggio chiaro invece di far fallire la query
  const [existing] = await db.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  )

  if (existing.length > 0) {
    return res.status(409).json({ error: 'Esiste già un account con questa email' })
  }

  // bcrypt trasforma la password in un hash da cui non si può tornare
  // indietro. Il 10 è il costo: più è alto, più il calcolo è lento, e più
  // è lento provare milioni di password per indovinarla.
  const passwordHash = await bcrypt.hash(password, 10)

  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  )

  // Nella risposta non mando mai l'hash della password
  res.status(201).json({ id: result.insertId, name: name, email: email, role: 'user' })
})

module.exports = router
