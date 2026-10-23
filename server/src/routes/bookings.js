const express = require('express')
const db = require('../db')
const { validId } = require('../validation')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// Prenotazione di un posto in una lezione, per l'utente collegato.
// L'id della lezione arriva nel corpo: { "class_id": 3 }
router.post('/', requireAuth, async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Manca il corpo della richiesta' })
  }

  const classId = validId(req.body.class_id)

  if (classId === null) {
    return res.status(400).json({ error: 'Id della lezione non valido' })
  }

  const userId = req.user.id

  // Uso una transazione su una connessione dedicata. Il motivo: se due
  // persone prenotano l'ultimo posto nello stesso istante, entrambe
  // potrebbero contare i posti, vedere che ne resta uno e inserire la
  // prenotazione, superando la capienza.
  // Con SELECT ... FOR UPDATE la riga della lezione resta bloccata fino al
  // commit: la seconda richiesta aspetta che la prima abbia finito, e
  // quando conta i posti vede già la prenotazione dell'altra.
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [classes] = await connection.execute(
      'SELECT id, title, starts_at, capacity FROM classes WHERE id = ? FOR UPDATE',
      [classId]
    )

    if (classes.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Lezione non trovata' })
    }

    const lesson = classes[0]

    if (lesson.starts_at < new Date()) {
      await connection.rollback()
      return res.status(400).json({ error: 'La lezione è già iniziata, non si può più prenotare' })
    }

    const [existing] = await connection.execute(
      'SELECT id FROM bookings WHERE user_id = ? AND class_id = ?',
      [userId, classId]
    )

    if (existing.length > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Hai già prenotato questa lezione' })
    }

    const [counts] = await connection.execute(
      'SELECT COUNT(*) AS booked FROM bookings WHERE class_id = ?',
      [classId]
    )

    if (counts[0].booked >= lesson.capacity) {
      await connection.rollback()
      return res.status(409).json({ error: 'La lezione è al completo' })
    }

    const [result] = await connection.execute(
      'INSERT INTO bookings (user_id, class_id) VALUES (?, ?)',
      [userId, classId]
    )

    // Solo qui le modifiche diventano definitive e la riga si sblocca
    await connection.commit()

    res.status(201).json({ id: result.insertId, class_id: classId, title: lesson.title })
  } catch (error) {
    // Qualcosa è andato storto a metà: annullo tutto quello che la
    // transazione aveva fatto, poi passo l'errore al gestore centrale
    await connection.rollback()
    throw error
  } finally {
    // In ogni caso, riuscito o no, restituisco la connessione al pool
    connection.release()
  }
})

// Prossime lezioni prenotate dall'utente collegato.
// La JOIN prende da classes i dati della lezione di ogni prenotazione:
// qui va bene una JOIN normale, perché ogni prenotazione ha sempre la sua
// lezione.
router.get('/me', requireAuth, async (req, res) => {
  const [bookings] = await db.execute(
    `SELECT b.id, b.class_id, c.title, c.category, c.coach, c.starts_at, c.duration_minutes
     FROM bookings b
     JOIN classes c ON c.id = b.class_id
     WHERE b.user_id = ? AND c.starts_at >= NOW()
     ORDER BY c.starts_at`,
    [req.user.id]
  )

  res.json(bookings)
})

// Disdetta di una prenotazione dell'utente collegato
router.delete('/:id', requireAuth, async (req, res) => {
  const id = validId(req.params.id)

  if (id === null) {
    return res.status(400).json({ error: 'Id della prenotazione non valido' })
  }

  // Cerco la prenotazione solo tra quelle dell'utente: se appartiene a
  // qualcun altro rispondo come se non esistesse, così non si può
  // disdire la prenotazione di un altro
  const [bookings] = await db.execute(
    `SELECT b.id, c.starts_at
     FROM bookings b
     JOIN classes c ON c.id = b.class_id
     WHERE b.id = ? AND b.user_id = ?`,
    [id, req.user.id]
  )

  if (bookings.length === 0) {
    return res.status(404).json({ error: 'Prenotazione non trovata' })
  }

  if (bookings[0].starts_at < new Date()) {
    return res.status(400).json({ error: 'La lezione è già iniziata, non si può più disdire' })
  }

  await db.execute('DELETE FROM bookings WHERE id = ?', [id])

  res.status(204).end()
})

module.exports = router
