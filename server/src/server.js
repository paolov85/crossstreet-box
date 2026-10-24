const app = require('./app')
const db = require('./db')

// In produzione la porta la decide il servizio di hosting con la variabile
// PORT; in locale si usa la 3000
const port = process.env.PORT || 3000

// Controllo all'avvio che il database risponda
db.query('SELECT 1')
  .then(() => {
    console.log('Connessione al database riuscita')
  })
  .catch((error) => {
    console.log('Errore di connessione al database: ' + error.message)
  })

app.listen(port, () => {
  console.log('Server in ascolto sulla porta ' + port)
})
