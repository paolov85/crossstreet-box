const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')
const { app, db, resetDatabase, createUser } = require('./helpers')

beforeEach(async () => {
  await resetDatabase()
})

// Senza chiudere il pool il processo dei test resterebbe appeso
after(async () => {
  await db.end()
})

test('registra un utente senza restituire la password', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'password123' })

  assert.strictEqual(response.status, 201)
  assert.strictEqual(response.body.email, 'anna@mail.it')
  assert.strictEqual(response.body.role, 'user')
  assert.strictEqual(response.body.password_hash, undefined)
})

test('nel database salva l\'hash e non la password in chiaro', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'password123' })

  const [users] = await db.execute('SELECT password_hash FROM users WHERE email = ?', ['anna@mail.it'])

  assert.notStrictEqual(users[0].password_hash, 'password123')
  assert.ok(users[0].password_hash.startsWith('$2'))
})

test('non accetta due account con la stessa email, anche con maiuscole diverse', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'password123' })

  const second = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'ANNA@mail.it', password: 'password123' })

  assert.strictEqual(second.status, 409)
})

test('rifiuta email non valida e password troppo corta', async () => {
  const badEmail = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'non-una-email', password: 'password123' })

  const shortPassword = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'corta' })

  assert.strictEqual(badEmail.status, 400)
  assert.strictEqual(shortPassword.status, 400)
})

test('il login con i dati giusti restituisce un token', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'password123' })

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'anna@mail.it', password: 'password123' })

  assert.strictEqual(response.status, 200)
  assert.strictEqual(typeof response.body.token, 'string')
  assert.strictEqual(response.body.user.email, 'anna@mail.it')
})

test('password sbagliata ed email inesistente danno lo stesso errore', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Anna', email: 'anna@mail.it', password: 'password123' })

  const wrongPassword = await request(app)
    .post('/api/auth/login')
    .send({ email: 'anna@mail.it', password: 'sbagliata1' })

  const unknownEmail = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nessuno@mail.it', password: 'password123' })

  assert.strictEqual(wrongPassword.status, 401)
  assert.strictEqual(unknownEmail.status, 401)
  assert.strictEqual(wrongPassword.body.error, unknownEmail.body.error)
})

test('/api/auth/me risponde solo con un token valido', async () => {
  const token = await createUser('anna@mail.it', false)

  const withToken = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer ' + token)

  const withoutToken = await request(app).get('/api/auth/me')

  const tamperedToken = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer ' + token + 'x')

  assert.strictEqual(withToken.status, 200)
  assert.strictEqual(withToken.body.email, 'anna@mail.it')
  assert.strictEqual(withoutToken.status, 401)
  assert.strictEqual(tamperedToken.status, 401)
})
