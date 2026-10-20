// Controlli sui dati che arrivano dal client, raccolti qui perché servono
// in più rotte.

// Il testo deve essere una stringa non vuota e non più lunga della colonna
// nel database. Restituisce il testo ripulito dagli spazi ai lati, oppure
// null se non va bene.
function validText (value, maxLength) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (trimmed === '' || trimmed.length > maxLength) {
    return null
  }

  return trimmed
}

// L'email deve avere la forma testo@testo.testo, senza spazi.
// La salvo sempre in minuscolo, così "Mario@Mail.it" e "mario@mail.it"
// non diventano due account diversi.
function validEmail (value) {
  const email = validText(value, 255)

  if (email === null) {
    return null
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email)) {
    return null
  }

  return email.toLowerCase()
}

// La password deve avere almeno 8 caratteri. Non la ripulisco dagli spazi:
// fanno parte della password scelta dall'utente.
function validPassword (value) {
  if (typeof value !== 'string' || value.length < 8) {
    return null
  }

  return value
}

module.exports = { validText, validEmail, validPassword }
