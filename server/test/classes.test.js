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

// Dati validi per creare una lezione: una data tra una settimana
function classData () {
  const startsAt = new Date()
  startsAt.setDate(startsAt.getDate() + 7)

  return {
    title: 'Hyrox Simulation',
    category: 'Hyrox',
    coach: 'Giulia Ferri',
    starts_at: startsAt.toISOString(),
    duration_minutes: 75,
    capacity: 10
  }
}

test('il calendario è pubblico e mostra i posti liberi', async () => {
  const classId = await createClass(5, 1)
  const token = await createUser('anna@mail.it', false)

  await request(app)
    .post('/api/bookings')
    .set('Authorization', 'Bearer ' + token)
    .send({ class_id: classId })

  // Nessun token: il calendario si vede anche senza login
  const response = await request(app).get('/api/classes')

  assert.strictEqual(response.status, 200)
  assert.strictEqual(response.body.length, 1)
  assert.strictEqual(response.body[0].available_spots, 4)
})

test('una lezione senza prenotazioni ha tutti i posti liberi', async () => {
  await createClass(12, 1)

  const response = await request(app).get('/api/classes')

  assert.strictEqual(response.body[0].available_spots, 12)
})

test('il calendario non mostra le lezioni già passate', async () => {
  await createClass(10, -1)
  await createClass(10, 1)

  const response = await request(app).get('/api/classes')

  assert.strictEqual(response.body.length, 1)
})

test('solo l\'admin può creare una lezione', async () => {
  const userToken = await createUser('anna@mail.it', false)
  const adminToken = await createUser('admin@mail.it', true)

  const noToken = await request(app).post('/api/classes').send(classData())

  const asUser = await request(app)
    .post('/api/classes')
    .set('Authorization', 'Bearer ' + userToken)
    .send(classData())

  const asAdmin = await request(app)
    .post('/api/classes')
    .set('Authorization', 'Bearer ' + adminToken)
    .send(classData())

  assert.strictEqual(noToken.status, 401)
  assert.strictEqual(asUser.status, 403)
  assert.strictEqual(asAdmin.status, 201)
  assert.strictEqual(asAdmin.body.available_spots, 10)
})

test('rifiuta una lezione con categoria inesistente o data passata', async () => {
  const adminToken = await createUser('admin@mail.it', true)

  const badCategory = classData()
  badCategory.category = 'Yoga'

  const pastDate = classData()
  pastDate.starts_at = '2020-01-01T10:00'

  const first = await request(app)
    .post('/api/classes')
    .set('Authorization', 'Bearer ' + adminToken)
    .send(badCategory)

  const second = await request(app)
    .post('/api/classes')
    .set('Authorization', 'Bearer ' + adminToken)
    .send(pastDate)

  assert.strictEqual(first.status, 400)
  assert.strictEqual(second.status, 400)
})

test('non si possono ridurre i posti sotto il numero di prenotati', async () => {
  const adminToken = await createUser('admin@mail.it', true)
  const classId = await createClass(5, 1)

  for (let i = 1; i <= 3; i++) {
    const token = await createUser('utente' + i + '@mail.it', false)

    await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer ' + token)
      .send({ class_id: classId })
  }

  const data = classData()
  data.capacity = 2

  const response = await request(app)
    .put('/api/classes/' + classId)
    .set('Authorization', 'Bearer ' + adminToken)
    .send(data)

  assert.strictEqual(response.status, 409)
})

test('eliminando una lezione spariscono anche le sue prenotazioni', async () => {
  const adminToken = await createUser('admin@mail.it', true)
  const userToken = await createUser('anna@mail.it', false)
  const classId = await createClass(5, 1)

  await request(app)
    .post('/api/bookings')
    .set('Authorization', 'Bearer ' + userToken)
    .send({ class_id: classId })

  const response = await request(app)
    .delete('/api/classes/' + classId)
    .set('Authorization', 'Bearer ' + adminToken)

  const [bookings] = await db.execute('SELECT id FROM bookings WHERE class_id = ?', [classId])

  assert.strictEqual(response.status, 204)
  assert.strictEqual(bookings.length, 0)
})
