import { session, clearSession } from './auth'

// Tutte le chiamate all'API passano da qui, così l'indirizzo del server
// e la gestione degli errori stanno in un punto solo.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Manda una richiesta all'API e restituisce i dati della risposta.
// Se l'utente è collegato aggiunge il token, che le rotte protette
// del server richiedono.
// Se il server risponde con un errore, lancia un Error con il messaggio
// che ha scritto il server (es. "Esiste già un account con questa email").
export async function apiRequest(path, options = {}) {
  const headers = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (session.token) {
    headers['Authorization'] = 'Bearer ' + session.token
  }

  let response

  try {
    response = await fetch(API_URL + '/api' + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    // fetch fallisce solo se il server non si raggiunge proprio
    // (spento, rete assente, oppure Render che si sta ancora svegliando)
    throw new Error('Il server non risponde. Riprova tra qualche secondo.')
  }

  // 204 = operazione riuscita senza contenuto (es. una cancellazione)
  if (response.status === 204) {
    return null
  }

  // 401 con un token salvato vuol dire che il token è scaduto (dopo 24 ore)
  // o non è più valido: lo dimentico, così l'app torna allo stato di
  // utente non collegato. Il 401 del login con password sbagliata non
  // passa da qui, perché in quel momento non c'è nessun token.
  if (response.status === 401 && session.token) {
    clearSession()
    throw new Error('La sessione è scaduta, accedi di nuovo')
  }

  const data = await response.json()

  if (!response.ok) {
    // Allego anche il codice HTTP, per chi deve distinguere i casi
    const error = new Error(data.error || 'Si è verificato un errore')
    error.status = response.status
    throw error
  }

  return data
}
