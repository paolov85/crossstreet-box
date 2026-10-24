const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')
const { app, db, resetDatabase, createUser, createClass } = require('./helpers')

beforeEach(async () => {
  await resetDatabase()
})

after(async () => {
  await db.end()
})

// Prenota una lezione con il token indicato e restituisce la risposta
function book (token, classId) {
  return request(app)
    .post('/api/bookings')
    .set('Authorization', 'Bearer ' + token)
    .send({ class_id: classId })
}

test('senza login non si può prenotare', async () => {
  const classId = await createClass(10, 1)

  const response = await request(app)
    .post('/api/bookings')
    .send({ class_id: classId })

  assert.strictEqual(response.status, 401)
})

test('prenota una lezione e la ritrova tra le proprie prenotazioni', async () => {
  const token = await createUser('anna@mail.it', false)
  const classId = await createClass(10, 1)

  const booking = await book(token, classId)

  const mine = await request(app)
    .get('/api/bookings/me')
    .set('Authorization', 'Bearer ' + token)

  assert.strictEqual(booking.status, 201)
  assert.strictEqual(mine.body.length, 1)
  assert.strictEqual(mine.body[0].class_id, classId)
})

test('non si può prenotare due volte la stessa lezione', async () => {
  const token = await createUser('anna@mail.it', false)
  const classId = await createClass(10, 1)

  await book(token, classId)
  const second = await book(token, classId)

  assert.strictEqual(second.status, 409)
})

test('non si può prenotare una lezione al completo', async () => {
  const classId = await createClass(1, 1)
  const firstToken = await createUser('anna@mail.it', false)
  const secondToken = await createUser('luca@mail.it', false)

  const first = await book(firstToken, classId)
  const second = await book(secondToken, classId)

  assert.strictEqual(first.status, 201)
  assert.strictEqual(second.status, 409)
})

test('non si può prenotare una lezione già passata', async () => {
  const token = await createUser('anna@mail.it', false)
  const classId = await createClass(10, -1)

  const response = await book(token, classId)

  assert.strictEqual(response.status, 400)
})

test('con richieste contemporanee la capienza non viene superata', async () => {
  const classId = await createClass(2, 1)

  const tokens = []
  for (let i = 1; i <= 6; i++) {
    tokens.push(await createUser('utente' + i + '@mail.it', false))
  }

  // Promise.all fa partire le sei prenotazioni insieme, senza aspettare
  // che finisca la precedente: è il caso in cui serve la transazione
  const requests = []
  for (let i = 0; i < tokens.length; i++) {
    requests.push(book(tokens[i], classId))
  }
  const responses = await Promise.all(requests)

  let created = 0
  for (let i = 0; i < responses.length; i++) {
    if (responses[i].status === 201) {
      created++
    }
  }

  const [bookings] = await db.execute('SELECT id FROM bookings WHERE class_id = ?', [classId])

  assert.strictEqual(created, 2)
  assert.strictEqual(bookings.length, 2)
})

test('disdice la propria prenotazione e il posto torna libero', async () => {
  const token = await createUser('anna@mail.it', false)
  const classId = await createClass(1, 1)

  const booking = await book(token, classId)

  const cancel = await request(app)
    .delete('/api/bookings/' + booking.body.id)
    .set('Authorization', 'Bearer ' + token)

  const calendar = await request(app).get('/api/classes')

  assert.strictEqual(cancel.status, 204)
  assert.strictEqual(calendar.body[0].available_spots, 1)
})

test('non si può disdire la prenotazione di un altro utente', async () => {
  const annaToken = await createUser('anna@mail.it', false)
  const lucaToken = await createUser('luca@mail.it', false)
  const classId = await createClass(10, 1)

  const booking = await book(annaToken, classId)

  const response = await request(app)
    .delete('/api/bookings/' + booking.body.id)
    .set('Authorization', 'Bearer ' + lucaToken)

  assert.strictEqual(response.status, 404)
})
