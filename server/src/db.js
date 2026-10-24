const mysql = require('mysql2/promise')
require('dotenv').config()

// Il pool tiene aperte alcune connessioni e le riusa a ogni richiesta,
// invece di aprirne una nuova ogni volta e chiuderla subito dopo.
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}

// Il database online accetta solo connessioni cifrate (SSL). DB_SSL_CA
// contiene il certificato del fornitore, che serve a verificare di parlare
// davvero con il suo server. In locale la variabile è vuota e si resta
// senza SSL.
if (process.env.DB_SSL_CA) {
  config.ssl = { ca: process.env.DB_SSL_CA }
}

const pool = mysql.createPool(config)

module.exports = pool
