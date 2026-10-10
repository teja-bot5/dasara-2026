const db = require("../database");

const {
  appendRow,
  getRows
} = require("../googleSheets");


/* =========================
   KUMKUM POOJA SETTINGS
========================= */

const KUMKUM_FEE = 216;


/* =========================
   DAILY POOJA SETTINGS
========================= */

const TOTAL_DAYS = 10;

const SLOTS_PER_DAY = 3;


/* =====================================================
   DAILY POOJA SLOTS
   GOOGLE SHEETS = SOURCE OF TRUTH
===================================================== */

exports.getSlots = async (req, res) => {

  try {

    const rows =
      await getRows(
        "Pooja Registrations",
        "A:D"
      );


    const booked =
      Array(TOTAL_DAYS).fill(0);


    rows.forEach((row) => {

      const day =
        Number(row[0]);


      if (
        day >= 1 &&
        day <= TOTAL_DAYS
      ) {

        booked[day - 1]++;

      }

    });


    return res.json({
      booked
    });


  } catch (error) {

    console.error(
      "Get pooja slots error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Could not load pooja slots"

    });

  }

};


/* =====================================================
   DAILY POOJA REGISTRATION
===================================================== */

exports.register = async (req, res) => {

  const {
    day,
    name,
    phone
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if (!day || !name || !phone) {

    return res.status(400).json({

      error:
        "Day, name and phone are required"

    });

  }


  if (
    day < 1 ||
    day > TOTAL_DAYS
  ) {

    return res.status(400).json({

      error:
        "Invalid pooja day"

    });

  }


  const cleanName =
    name.trim();

  const cleanPhone =
    phone.trim();


  if (!/^[0-9]{10}$/.test(cleanPhone)) {

    return res.status(400).json({

      error:
        "Please enter a valid 10-digit phone number"

    });

  }


  try {

    /* =================================================
       CHECK GOOGLE SHEETS CAPACITY
    ================================================= */

    const rows =
      await getRows(
        "Pooja Registrations",
        "A:D"
      );


    let booked = 0;


    rows.forEach((row) => {

      const registeredDay =
        Number(row[0]);


      if (registeredDay === Number(day)) {

        booked++;

      }

    });


    if (booked >= SLOTS_PER_DAY) {

      return res.status(409).json({

        error:
          "This pooja is already full"

      });

    }


    /* =================================================
       SAVE LOCAL RECORD
    ================================================= */

    const result =
      db.prepare(`
        INSERT INTO pooja_registrations
        (day, name, phone)
        VALUES (?, ?, ?)
      `).run(

        day,
        cleanName,
        cleanPhone

      );


    /* =================================================
       SAVE TO GOOGLE SHEETS
    ================================================= */

    try {

      await appendRow(
        "Pooja Registrations",
        [

          day,

          cleanName,

          cleanPhone,

          new Date().toISOString()

        ]
      );

    } catch (sheetError) {

      /*
         Remove SQLite record if
         Google Sheets fails.
      */

      db.prepare(`
        DELETE FROM pooja_registrations
        WHERE id = ?
      `).run(
        result.lastInsertRowid
      );


      console.error(
        "Google Sheets error:",
        sheetError
      );


      return res.status(502).json({

        success: false,

        error:
          "Registration could not be saved. Please try again."

      });

    }


    /* -------------------------
       Success
    ------------------------- */

    return res.status(201).json({

      success: true,

      id:
        result.lastInsertRowid

    });


  } catch (error) {

    console.error(
      "Pooja registration error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Could not complete registration"

    });

  }

};


/* =====================================================
   KUMKUM POOJA
   UPI + UTR
===================================================== */


/* =========================
   SUBMIT KUMKUM PAYMENT
========================= */

exports.submitKumkum = async (req, res) => {

  const {
    name,
    phone,
    email,
    utr
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if (!name || !phone || !utr) {

    return res.status(400).json({

      success: false,

      error:
        "Name, phone and UTR are required"

    });

  }


  const cleanName =
    name.trim();

  const cleanPhone =
    phone.trim();

  const cleanEmail =
    email
      ? email.trim()
      : "";

  const cleanUtr =
    utr.trim();


  if (!/^[0-9]{10}$/.test(cleanPhone)) {

    return res.status(400).json({

      success: false,

      error:
        "Please enter a valid 10-digit phone number"

    });

  }


  if (!/^[A-Za-z0-9]{6,30}$/.test(cleanUtr)) {

    return res.status(400).json({

      success: false,

      error:
        "Please enter a valid UTR / Transaction ID"

    });

  }


  try {

    /* =========================
       DUPLICATE UTR CHECK
    ========================= */

    const existing =
      db.prepare(`
        SELECT id
        FROM kumkum_payments
        WHERE utr = ?
      `).get(cleanUtr);


    if (existing) {

      return res.status(409).json({

        success: false,

        error:
          "This UTR has already been submitted"

      });

    }


    /* =========================
       SAVE PAYMENT
    ========================= */

    const result =
      db.prepare(`
        INSERT INTO kumkum_payments (
          amount,
          name,
          phone,
          email,
          payment_status,
          utr
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(

        KUMKUM_FEE,

        cleanName,

        cleanPhone,

        cleanEmail,

        "Pending Verification",

        cleanUtr

      );


    /* =========================
       GOOGLE SHEETS
    ========================= */

    try {

      await appendRow(
        "Kumkum Pooja",
        [

          new Date().toISOString(),

          KUMKUM_FEE,

          cleanName,

          cleanPhone,

          cleanEmail,

          "Pending Verification",

          cleanUtr

        ]
      );

    } catch (sheetError) {

      /*
         If Google Sheets fails,
         remove the local record so
         the user can safely retry.
      */

      db.prepare(`
        DELETE FROM kumkum_payments
        WHERE id = ?
      `).run(
        result.lastInsertRowid
      );


      console.error(
        "Kumkum Google Sheets error:",
        sheetError
      );


      return res.status(502).json({

        success: false,

        error:
          "Payment details could not be saved. Please try again."

      });

    }


    /* =========================
       SUCCESS
    ========================= */

    return res.status(201).json({

      success: true,

      id:
        result.lastInsertRowid,

      amount:
        KUMKUM_FEE,

      payment_status:
        "Pending Verification",

      message:
        "Payment details submitted successfully. Your payment is Pending Verification by the committee."

    });


  } catch (error) {

    console.error(
      "Kumkum payment submission error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Unable to submit Kumkum Pooja payment details"

    });

  }

};