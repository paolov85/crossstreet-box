const request = require('supertest')
const app = require('../src/app')
const db = require('../src/db')

// Funzioni comuni a tutti i file di test

// Svuota le tabelle, così ogni test parte da zero e il risultato non
// dipende da quello che hanno lasciato i test precedenti.
// L'ordine conta: prima bookings, che ha le chiavi esterne verso le altre.
async function resetDatabase () {
  await db.query('DELETE FROM bookings')
  await db.query('DELETE FROM classes')
  await db.query('DELETE FROM users')
}

// Registra un utente passando dall'API, fa il login e restituisce il token.
// Con isAdmin a true lo promuove ad admin direttamente nel database, prima
// del login, così il token contiene già il ruolo giusto.
async function createUser (email, isAdmin) {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Utente di prova', email: email, password: 'password123' })

  if (isAdmin) {
    await db.execute('UPDATE users SET role = \'admin\' WHERE email = ?', [email])
  }

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: email, password: 'password123' })

  return login.body.token
}

// Inserisce una lezione direttamente nel database e ne restituisce l'id.
// daysFromNow può essere negativo per creare una lezione già passata.
async function createClass (capacity, daysFromNow) {
  const startsAt = new Date()
  startsAt.setDate(startsAt.getDate() + daysFromNow)

  const [result] = await db.execute(
    `INSERT INTO classes (title, category, coach, starts_at, duration_minutes, capacity)
     VALUES ('Lezione di prova', 'CrossFit', 'Coach di prova', ?, 60, ?)`,
    [startsAt, capacity]
  )

  return result.insertId
}

module.exports = { app, db, resetDatabase, createUser, createClass }
