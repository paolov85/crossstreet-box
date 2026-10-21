const jwt = require('jsonwebtoken')

// Middleware per le rotte protette: lascia passare la richiesta solo se
// contiene un token JWT valido nell'header Authorization, nella forma
// "Bearer <token>"
function requireAuth (req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Devi fare il login per accedere' })
  }

  // Tolgo "Bearer " e resta solo il token
  const token = header.slice(7)

  // verify controlla la firma con la chiave segreta e la scadenza.
  // Se il token è stato modificato o è scaduto lancia un errore.
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Salvo id e ruolo nella richiesta, così le rotte successive sanno
    // chi è l'utente senza dover rileggere il token
    req.user = { id: payload.id, role: payload.role }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Sessione non valida o scaduta, rifai il login' })
  }
}

module.exports = { requireAuth }
