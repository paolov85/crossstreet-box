-- Schema del database di CrossStreet Box
-- Si esegue con: mysql -u root -p < migrations.sql

-- Il client mysql da terminale parla al server in latin1, mentre le tabelle
-- sono utf8mb4: senza questa riga i nomi accentati verrebbero salvati storti
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS crossstreet_box;

USE crossstreet_box;

-- Utenti registrati. La password non si salva mai in chiaro,
-- solo l'hash calcolato con bcrypt.
-- Il ruolo admin puo' creare, modificare ed eliminare le lezioni.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lezioni in calendario. capacity e' il numero massimo di posti prenotabili.
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  category ENUM('CrossFit', 'Hyrox', 'Open Box') NOT NULL,
  coach VARCHAR(100) NOT NULL,
  starts_at DATETIME NOT NULL,
  duration_minutes INT NOT NULL,
  capacity INT NOT NULL
);

-- Prenotazioni: collegano un utente a una lezione.
-- Il vincolo UNIQUE impedisce che lo stesso utente prenoti due volte
-- la stessa lezione, anche se il controllo nell'API venisse saltato.
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  class_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, class_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Dati di esempio, per provare l'API senza doverli inserire a mano.
-- Le date partono da oggi (CURDATE), cosi' le lezioni restano sempre
-- nel futuro anche se il database viene creato tra qualche mese.
-- Gli utenti non si inseriscono qui: l'hash della password lo calcola
-- l'API alla registrazione.

INSERT INTO classes (title, category, coach, starts_at, duration_minutes, capacity) VALUES
  ('WOD del mattino', 'CrossFit', 'Marco Rinaldi', TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '07:00:00'), 60, 12),
  ('Hyrox Simulation', 'Hyrox', 'Giulia Ferri', TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '18:30:00'), 75, 10),
  ('Open Box', 'Open Box', 'Luca Bianchi', TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '12:30:00'), 90, 20),
  ('WOD serale', 'CrossFit', 'Marco Rinaldi', TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '19:00:00'), 60, 12),
  ('Hyrox Endurance', 'Hyrox', 'Giulia Ferri', TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '07:30:00'), 60, 2),
  ('Team WOD', 'CrossFit', 'Luca Bianchi', TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '10:00:00'), 60, 15);
