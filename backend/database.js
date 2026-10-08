const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "../data/dasara.db")
);

db.pragma("journal_mode = WAL");


/* =========================
   POOJA REGISTRATIONS
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS pooja_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================
   CHANDA PAYMENTS
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS chanda_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    amount INTEGER NOT NULL,

    name TEXT NOT NULL,
    family_members TEXT,
    gothram TEXT,
    phone TEXT NOT NULL,
    email TEXT,

    payment_status TEXT NOT NULL
      DEFAULT 'Pending Verification',

    utr TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================
   KUMKUM POOJA PAYMENTS
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS kumkum_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    amount INTEGER NOT NULL DEFAULT 501,

    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,

    payment_status TEXT NOT NULL
      DEFAULT 'Pending Verification',

    utr TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================
   EXISTING DATABASE MIGRATION
========================= */

/*
   If an older database already exists,
   add the new UTR columns without
   breaking the existing database.
*/

try {

  db.exec(`
    ALTER TABLE chanda_payments
    ADD COLUMN utr TEXT;
  `);

} catch (error) {

  /*
     Column already exists.
     Nothing to do.
  */

}


try {

  db.exec(`
    ALTER TABLE kumkum_payments
    ADD COLUMN utr TEXT;
  `);

} catch (error) {

  /*
     Column already exists.
     Nothing to do.
  */

}


module.exports = db;