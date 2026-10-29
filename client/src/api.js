// Tutte le chiamate all'API passano da qui, così l'indirizzo del server
// e la gestione degli errori stanno in un punto solo.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Manda una richiesta all'API e restituisce i dati della risposta.
// Se il server risponde con un errore, lancia un Error con il messaggio
// che ha scritto il server (es. "Esiste già un account con questa email").
export async function apiRequest(path, options = {}) {
  const headers = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
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

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Si è verificato un errore')
  }

  return data
}
