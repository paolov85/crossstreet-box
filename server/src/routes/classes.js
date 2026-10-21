const express = require('express')
const db = require('../db')
const { categories } = require('../validation')

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
    WHERE c.starts_at >= NOW()`
  const params = []

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

module.exports = router
