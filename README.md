# CrossStreet Box

Web app per la prenotazione delle lezioni di CrossStreet Box, palestra
specializzata in CrossFit e Hyrox.

Progetto finale del Master Web Developer Full Stack di start2impact: front end,
back end e database, con registrazione, login e logout.

**Sito online:** https://crossstreet-box.netlify.app

> Il back end usa i piani gratuiti di Render e Aiven. Dopo 15 minuti senza
> traffico il server si addormenta e la prima richiesta può metterci fino a un
> minuto: il sito lo segnala con un avviso giallo sotto la barra. Il database
> gratuito può essere spento da Aiven se resta inattivo a lungo e va
> riacceso dalla sua console.

## Cosa si può fare

Chiunque può consultare il calendario delle prossime lezioni, filtrarlo per
categoria (CrossFit, Hyrox, Open Box) e vedere i posti liberi.

Un utente registrato può:

- prenotare un posto in una lezione, se non è piena e non è già iniziata;
- vedere le proprie prenotazioni e disdirle prima dell'inizio della lezione.

Un admin può inoltre creare, modificare ed eliminare le lezioni. Non può
ridurre i posti di una lezione sotto il numero di persone già prenotate;
eliminando una lezione si cancellano anche le sue prenotazioni.

## Stack

| Parte | Tecnologie | Online su |
|---|---|---|
| Front end (`client/`) | Vue 3, Vue Router, Vite | Netlify |
| Back end (`server/`) | Node.js, Express 5, mysql2, bcryptjs, jsonwebtoken | Render |
| Database | MySQL 8 | Aiven |

Front end e back end stanno sullo stesso repository ma sono due applicazioni
separate, che comunicano solo tramite l'API REST in JSON.

## Avvio in locale

Servono Node.js 20 o superiore e MySQL 8 o superiore.

**Database e back end**

```
cd server
npm install
mysql -u root -p < migrations.sql
cp .env.example .env
npm run dev
```

In `.env` vanno i dati di accesso al database e un `JWT_SECRET` lungo e
casuale (il comando per generarlo è in `.env.example`). L'API risponde su
`http://localhost:3000`.

`migrations.sql` crea le tabelle e sei lezioni di esempio a partire da domani.
Gli utenti si creano dal sito; per rendere admin un utente:

```
mysql -u root -p crossstreet_box -e "UPDATE users SET role = 'admin' WHERE email = 'email@esempio.it'"
```

Dopo il cambio di ruolo bisogna uscire e rientrare, perché il ruolo è
scritto nel token.

**Front end**, in un secondo terminale:

```
cd client
npm install
npm run dev
```

Il sito si apre su `http://localhost:5173`. Senza configurazione cerca l'API
su `localhost:3000`; per usarne un'altra si imposta `VITE_API_URL` (vedi
`client/.env.example`).

## API

Tutti gli indirizzi iniziano con `/api`. Le rotte protette vogliono
l'intestazione `Authorization: Bearer <token>`, con il token ricevuto dal login.

| Metodo | Indirizzo | Accesso | Cosa fa |
|---|---|---|---|
| POST | `/auth/register` | tutti | registrazione |
| POST | `/auth/login` | tutti | login, restituisce il token |
| POST | `/auth/logout` | utente | chiude la sessione: il token non vale più |
| GET | `/auth/me` | utente | dati dell'utente collegato |
| GET | `/classes` | tutti | prossime lezioni con i posti liberi, filtro `?category=` |
| POST | `/classes` | admin | crea una lezione |
| PUT, DELETE | `/classes/:id` | admin | modifica o elimina una lezione |
| POST | `/bookings` | utente | prenota una lezione, corpo `{ "class_id": 3 }` |
| GET | `/bookings/me` | utente | prossime lezioni prenotate |
| DELETE | `/bookings/:id` | utente | disdice una propria prenotazione |

Gli errori rispondono con un codice HTTP e un messaggio, ad esempio
`{ "error": "La lezione è al completo" }`: 400 dati non validi, 401 login
mancante o token scaduto, 403 riservato all'admin, 404 non trovato, 409
conflitto (email già registrata, lezione piena, prenotazione doppia).

## Test

```
cd server
npm test
```

Sono 26 test con `node:test` e supertest su registrazione, login, logout,
permessi, lezioni e prenotazioni. Girano su un database separato,
`crossstreet_box_test`, che si crea una volta con:

```
sed 's/crossstreet_box/crossstreet_box_test/' migrations.sql | mysql -u root -p
```

## Scelte tecniche

- **Password**: salvate solo come hash bcrypt, mai in chiaro. Il login dà lo
  stesso messaggio per email inesistente e password sbagliata, così non si
  scopre quali email sono registrate.
- **JWT invece della sessione con cookie**: front end e back end sono su domini
  diversi e il token nell'intestazione evita i problemi dei cookie tra domini.
  Il token contiene solo id, ruolo e un identificativo unico, e scade dopo 24
  ore.
- **Logout vero anche sul server**: un JWT resta valido fino alla scadenza
  anche se il browser lo dimentica. Il logout salva il suo identificativo nella
  tabella `revoked_tokens` e da quel momento il server lo rifiuta. Chiude solo
  la sessione di quel token: un login aperto su un altro dispositivo resta
  valido.
- **Permessi controllati sul server**: i controlli del router di Vue servono
  solo a guidare l'utente. Ogni rotta protetta verifica token e ruolo nel back
  end, e una prenotazione di un altro utente risponde 404 come se non esistesse.
- **L'ultimo posto libero**: la prenotazione avviene in una transazione con
  `SELECT ... FOR UPDATE` sulla lezione. Se due persone prenotano l'ultimo
  posto nello stesso istante, la seconda aspetta la prima e trova la lezione
  piena. Un test lancia sei prenotazioni contemporanee su due posti e verifica
  che ne passino esattamente due.
- **Doppia prenotazione**: impedita sia dal controllo nella rotta sia dal
  vincolo `UNIQUE (user_id, class_id)` nel database.
- **Date e fusi orari**: il server manda le date in UTC e il browser le mostra
  in ora italiana. L'ora attuale la fornisce Node (`new Date()`), non `NOW()` di
  MySQL, così c'è un solo orologio di riferimento.
- **Query**: ogni valore che arriva dal client passa come parametro di un
  prepared statement, mai concatenato nel testo SQL.
- **Configurazione**: credenziali e segreti stanno in variabili d'ambiente
  (`.env` in locale, pannelli di Render e Netlify online). Nel repository ci
  sono solo i file `.env.example`.

## Limiti noti

- Il ruolo è scritto nel token: un admin declassato resta admin fino alla
  scadenza del token (24 ore).
- Il token è salvato nel `localStorage` del browser. Vue mostra il testo senza
  interpretarlo come HTML, il che riduce il rischio di script iniettati, ma
  un cookie `httpOnly` sarebbe più sicuro.
- Non c'è il recupero della password né la promozione ad admin dal sito: il
  ruolo si cambia nel database.
