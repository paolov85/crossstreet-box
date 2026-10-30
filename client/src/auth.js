import { reactive } from 'vue'

// Il token e i dati dell'utente vengono salvati nel localStorage del browser,
// così restano anche se si ricarica la pagina o si chiude la scheda.
const TOKEN_KEY = 'crossstreet_token'
const USER_KEY = 'crossstreet_user'

// Se il valore salvato è stato modificato a mano e non è JSON valido,
// JSON.parse lancia un errore: in quel caso considero l'utente non collegato.
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch (error) {
    return null
  }
}

// Stato dell'utente condiviso da tutta l'app. È reactive: quando cambia,
// ogni componente che lo usa (ad esempio la barra di navigazione) si
// aggiorna da solo.
export const session = reactive({
  token: localStorage.getItem(TOKEN_KEY),
  user: readStoredUser(),
})

// Dopo il login: salvo token e utente sia nello stato sia nel browser
export function saveSession(token, user) {
  session.token = token
  session.user = user
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Logout. Con JWT il server non tiene traccia delle sessioni: per uscire
// basta che il browser dimentichi il token.
export function clearSession() {
  session.token = null
  session.user = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
