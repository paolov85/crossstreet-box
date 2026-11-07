import { reactive } from 'vue'
import { session, clearSession } from './auth'

// Tutte le chiamate all'API passano da qui, così l'indirizzo del server
// e la gestione degli errori stanno in un punto solo.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Il server gratuito su Render si addormenta dopo 15 minuti senza traffico
// e la prima richiesta può metterci fino a un minuto. Se una richiesta
// supera SLOW_AFTER, App.vue mostra un avviso, così l'utente sa che deve
// aspettare e non pensa che il sito sia rotto.
const SLOW_AFTER = 4000
// Oltre questo tempo smetto di aspettare
const GIVE_UP_AFTER = 90000

// Quante richieste stanno superando SLOW_AFTER in questo momento
export const requestStatus = reactive({ slowCount: 0 })

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

  let isSlow = false
  const slowTimer = setTimeout(() => {
    isSlow = true
    requestStatus.slowCount++
  }, SLOW_AFTER)

  // AbortController permette di interrompere fetch: senza, una richiesta
  // a un server che non risponde potrebbe restare in attesa per minuti
  const controller = new AbortController()
  const giveUpTimer = setTimeout(() => controller.abort(), GIVE_UP_AFTER)

  let response

  try {
    response = await fetch(API_URL + '/api' + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    // fetch fallisce solo se il server non si raggiunge proprio
    // (spento, rete assente) o se l'ho interrotto io dopo GIVE_UP_AFTER
    throw new Error('Il server non risponde. Controlla la connessione e riprova tra poco.')
  } finally {
    // Riuscita o no, la richiesta è finita: tolgo i timer e l'avviso
    clearTimeout(slowTimer)
    clearTimeout(giveUpTimer)

    if (isSlow) {
      requestStatus.slowCount--
    }
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

  // Di solito l'API risponde in JSON, ma in caso di guasto (ad esempio un
  // 502 di Render mentre il servizio riparte) può arrivare una pagina HTML:
  // in quel caso response.json() lancerebbe un errore poco chiaro
  let data = {}

  try {
    data = await response.json()
  } catch (error) {
    data = {}
  }

  if (!response.ok) {
    // Allego anche il codice HTTP, per chi deve distinguere i casi
    const error = new Error(data.error || 'Il server ha avuto un problema (errore ' + response.status + '). Riprova tra poco.')
    error.status = response.status
    throw error
  }

  return data
}
