const jwt = require('jsonwebtoken')
const db = require('../db')

// Middleware per le rotte protette: lascia passare la richiesta solo se
// contiene un token JWT valido nell'header Authorization, nella forma
// "Bearer <token>", e se quel token non è stato chiuso con il logout
async function requireAuth (req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Devi fare il login per accedere' })
  }

  // Tolgo "Bearer " e resta solo il token
  const token = header.slice(7)

  // verify controlla la firma con la chiave segreta e la scadenza.
  // Se il token è stato modificato o è scaduto lancia un errore.
  let payload

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return res.status(401).json({ error: 'Sessione non valida o scaduta, rifai il login' })
  }

  // Ogni token creato dal login ha un identificativo (jti): senza, il
  // logout non potrebbe chiuderlo, quindi non lo accetto
  if (!payload.jti) {
    return res.status(401).json({ error: 'Sessione non valida o scaduta, rifai il login' })
  }

  // La query sta fuori dal try: se il database non risponde l'errore va al
  // gestore centrale (500), invece di diventare un falso "sessione scaduta"
  const [revoked] = await db.execute(
    'SELECT jti FROM revoked_tokens WHERE jti = ?',
    [payload.jti]
  )

  if (revoked.length > 0) {
    return res.status(401).json({ error: 'Sessione chiusa, rifai il login' })
  }

  // Salvo i dati del token nella richiesta, così le rotte successive sanno
  // chi è l'utente senza dover rileggere il token. jti ed exp servono al
  // logout.
  req.user = { id: payload.id, role: payload.role, jti: payload.jti, exp: payload.exp }
  next()
}

// Middleware per le rotte riservate all'admin. Va messo dopo requireAuth,
// che ha già controllato il token e salvato il ruolo in req.user.
function requireAdmin (req, res, next) {
  // 403 e non 401: l'utente è riconosciuto, ma non ha il permesso
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Operazione riservata agli amministratori' })
  }

  next()
}

module.exports = { requireAuth, requireAdmin }
