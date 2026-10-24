const express = require('express')
const db = require('../db')
const { validText, validInteger, validId, validDate, categories } = require('../validation')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Calendario delle prossime lezioni, con i posti ancora liberi.
// È pubblico: si può consultare anche senza login, serve il login solo
// per prenotare.
// Si può filtrare per categoria, ad esempio /api/classes?category=Hyrox
router.get('/', async (req, res) => {
  const category = req.query.category

  if (category !== undefined && !categories.includes(category)) {
    return res.status(400).json({ error: 'Categoria non valida' })
  }

  // LEFT JOIN e non JOIN: una lezione senza prenotazioni deve comparire lo
  // stesso, con zero prenotati. Con una JOIN normale sparirebbe.
  // COUNT(b.id) conta le prenotazioni di ogni lezione: per le lezioni senza
  // prenotazioni b.id è NULL e COUNT non lo conta, quindi dà 0.
  let sql = `
    SELECT c.id, c.title, c.category, c.coach, c.starts_at, c.duration_minutes,
           c.capacity, c.capacity - COUNT(b.id) AS available_spots
    FROM classes c
    LEFT JOIN bookings b ON b.class_id = c.id
    WHERE c.starts_at >= ?`

  // L'ora attuale la passo da Node invece di usare NOW() di MySQL: così
  // l'unico orologio è quello del server Node, e non ci sono differenze
  // di fuso orario tra il server e il database online
  const params = [new Date()]

  if (category !== undefined) {
    sql = sql + ' AND c.category = ?'
    params.push(category)
  }

  // GROUP BY raggruppa le righe della JOIN per lezione, così COUNT conta
  // le prenotazioni di ciascuna
  sql = sql + ' GROUP BY c.id ORDER BY c.starts_at'

  const [classes] = await db.execute(sql, params)
  res.json(classes)
})

// Controlla i campi di una lezione inviati dall'admin.
// Restituisce un oggetto con error (il messaggio da mostrare) se qualcosa
// non va, altrimenti con values (i valori puliti da salvare).
// La uso sia per la creazione sia, più avanti, per la modifica.
function checkClass (body) {
  const title = validText(body.title, 100)
  const coach = validText(body.coach, 100)
  const startsAt = validDate(body.starts_at)
  const duration = validInteger(body.duration_minutes, 240)
  const capacity = validInteger(body.capacity, 100)

  if (title === null) {
    return { error: 'Il titolo deve essere un testo da 1 a 100 caratteri' }
  }

  if (!categories.includes(body.category)) {
    return { error: 'La categoria deve essere una tra: ' + categories.join(', ') }
  }

  if (coach === null) {
    return { error: 'Il nome del coach deve essere un testo da 1 a 100 caratteri' }
  }

  if (startsAt === null) {
    return { error: 'La data della lezione non è valida' }
  }

  // Non ha senso mettere in calendario una lezione già passata
  if (startsAt < new Date()) {
    return { error: 'La data della lezione deve essere nel futuro' }
  }

  if (duration === null) {
    return { error: 'La durata deve essere un numero intero di minuti, da 1 a 240' }
  }

  if (capacity === null) {
    return { error: 'I posti devono essere un numero intero da 1 a 100' }
  }

  return {
    values: {
      title: title,
      category: body.category,
      coach: coach,
      starts_at: startsAt,
      duration_minutes: duration,
      capacity: capacity
    }
  }
}

// Creazione di una nuova lezione, solo per l'admin.
// I due middleware si eseguono in ordine: prima il controllo del token,
// poi quello del ruolo.
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Manca il corpo della richiesta' })
  }

  const check = checkClass(req.body)

  if (check.error) {
    return res.status(400).json({ error: check.error })
  }

  const values = check.values

  const [result] = await db.execute(
    `INSERT INTO classes (title, category, coach, starts_at, duration_minutes, capacity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [values.title, values.category, values.coach, values.starts_at, values.duration_minutes, values.capacity]
  )

  // Rispondo con la lezione appena creata, che ha ancora tutti i posti liberi
  values.id = result.insertId
  values.available_spots = values.capacity

  res.status(201).json(values)
})

// Modifica di una lezione esistente, solo per l'admin
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = validId(req.params.id)

  if (id === null) {
    return res.status(400).json({ error: 'Id della lezione non valido' })
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Manca il corpo della richiesta' })
  }

  const check = checkClass(req.body)

  if (check.error) {
    return res.status(400).json({ error: check.error })
  }

  const values = check.values

  // Leggo la lezione insieme al numero di prenotazioni che ha già
  const [classes] = await db.execute(
    `SELECT c.id, COUNT(b.id) AS booked
     FROM classes c
     LEFT JOIN bookings b ON b.class_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  )

  if (classes.length === 0) {
    return res.status(404).json({ error: 'Lezione non trovata' })
  }

  const booked = classes[0].booked

  // Non si possono togliere posti già prenotati: se 8 persone sono iscritte,
  // la capienza non può scendere a 6
  if (values.capacity < booked) {
    return res.status(409).json({ error: 'Ci sono già ' + booked + ' prenotati: i posti non possono essere meno di così' })
  }

  await db.execute(
    `UPDATE classes
     SET title = ?, category = ?, coach = ?, starts_at = ?, duration_minutes = ?, capacity = ?
     WHERE id = ?`,
    [values.title, values.category, values.coach, values.starts_at, values.duration_minutes, values.capacity, id]
  )

  values.id = id
  values.available_spots = values.capacity - booked

  res.json(values)
})

// Eliminazione di una lezione, solo per l'admin.
// Le sue prenotazioni vengono cancellate in automatico dal database,
// grazie a ON DELETE CASCADE nella tabella bookings.
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = validId(req.params.id)

  if (id === null) {
    return res.status(400).json({ error: 'Id della lezione non valido' })
  }

  const [result] = await db.execute(
    'DELETE FROM classes WHERE id = ?',
    [id]
  )

  // affectedRows dice quante righe sono state eliminate: zero vuol dire
  // che la lezione non esisteva
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Lezione non trovata' })
  }

  // 204: operazione riuscita, nessun contenuto da restituire
  res.status(204).end()
})

module.exports = router
