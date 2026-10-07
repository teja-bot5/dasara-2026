const db = require("../database");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { appendRow } = require("../googleSheets");


/* =========================
   RAZORPAY
========================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


/* =========================
   KUMKUM POOJA FEE
========================= */

const KUMKUM_FEE = 501;


/* =========================
   DAILY POOJA SETTINGS
========================= */

const TOTAL_DAYS = 10;
const SLOTS_PER_DAY = 3;


/* =========================
   DAILY POOJA SLOTS
========================= */

exports.getSlots = (req, res) => {

  const rows = db.prepare(`
    SELECT day, COUNT(*) AS booked
    FROM pooja_registrations
    GROUP BY day
  `).all();


  /* 10 festival days */

  const booked = Array(TOTAL_DAYS).fill(0);


  rows.forEach((row) => {

    if(
      row.day >= 1 &&
      row.day <= TOTAL_DAYS
    ){

      booked[row.day - 1] =
        row.booked;

    }

  });


  res.json({
    booked
  });

};


/* =========================
   DAILY POOJA REGISTRATION
========================= */

exports.register = async (req, res) => {

  const {
    day,
    name,
    phone
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if(!day || !name || !phone){

    return res.status(400).json({

      error:
        "Day, name and phone are required"

    });

  }


  /* 10 days */

  if(
    day < 1 ||
    day > TOTAL_DAYS
  ){

    return res.status(400).json({

      error:
        "Invalid pooja day"

    });

  }


  const cleanName =
    name.trim();

  const cleanPhone =
    phone.trim();


  if(!/^[0-9]{10}$/.test(cleanPhone)){

    return res.status(400).json({

      error:
        "Please enter a valid 10-digit phone number"

    });

  }


  /* -------------------------
     Check capacity
  ------------------------- */

  const count =
    db.prepare(`
      SELECT COUNT(*) AS booked
      FROM pooja_registrations
      WHERE day = ?
    `).get(day).booked;


  /* 3 slots per day */

  if(count >= SLOTS_PER_DAY){

    return res.status(409).json({

      error:
        "This pooja is already full"

    });

  }


  try{

    /* -------------------------
       Save registration
    ------------------------- */

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


    /* -------------------------
       Google Sheets
    ------------------------- */

    try{

      await appendRow(
        "Pooja Registrations",
        [
          day,
          cleanName,
          cleanPhone
        ]
      );

    }catch(sheetError){

      console.error(
        "Google Sheets error:",
        sheetError.message
      );

    }


    /* -------------------------
       Success
    ------------------------- */

    return res.status(201).json({

      success: true,

      id:
        result.lastInsertRowid

    });


  }catch(error){

    console.error(
      "Pooja registration error:",
      error
    );


    return res.status(500).json({

      error:
        "Could not complete registration"

    });

  }

};


/* =====================================================
   KUMKUM POOJA
===================================================== */


/* =========================
   CREATE KUMKUM ORDER
========================= */

exports.createKumkum = async (req, res) => {

  const {
    name,
    phone,
    email
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if(!name || !phone){

    return res.status(400).json({

      error:
        "Name and phone are required"

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


  if(!/^[0-9]{10}$/.test(cleanPhone)){

    return res.status(400).json({

      error:
        "Please enter a valid 10-digit phone number"

    });

  }


  try{

    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    const order =
      await razorpay.orders.create({

        amount:
          KUMKUM_FEE * 100,

        currency:
          "INR",

        receipt:
          `kumkum_${Date.now()}`,

        notes: {

          name:
            cleanName,

          phone:
            cleanPhone

        }

      });


    /* =========================
       SAVE PENDING PAYMENT
    ========================= */

    const result =
      db.prepare(`
        INSERT INTO kumkum_payments (
          amount,
          name,
          phone,
          email,
          payment_status,
          razorpay_order_id
        )
        VALUES (?, ?, ?, ?, 'pending', ?)
      `).run(

        KUMKUM_FEE,

        cleanName,

        cleanPhone,

        cleanEmail,

        order.id

      );


    /* =========================
       SEND TO FRONTEND
    ========================= */

    return res.status(201).json({

      success: true,

      id:
        result.lastInsertRowid,

      amount:
        order.amount,

      currency:
        order.currency,

      order_id:
        order.id,

      key_id:
        process.env.RAZORPAY_KEY_ID

    });


  }catch(error){

    console.error(
      "Kumkum Razorpay order error:",
      error
    );


    return res.status(500).json({

      error:
        "Unable to create Kumkum Pooja payment"

    });

  }

};


/* =========================
   VERIFY KUMKUM PAYMENT
========================= */

exports.verifyKumkum = async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if(
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ){

    return res.status(400).json({

      success: false,

      error:
        "Payment verification details are required"

    });

  }


  try{

    /* =========================
       GENERATE SIGNATURE
    ========================= */

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
          "|" +
          razorpay_payment_id
        )
        .digest("hex");


    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );


    /* -------------------------
       Length check
    ------------------------- */

    if(
      generatedBuffer.length !==
      receivedBuffer.length
    ){

      return res.status(400).json({

        success: false,

        error:
          "Payment verification failed"

      });

    }


    /* -------------------------
       Signature check
    ------------------------- */

    const valid =
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );


    if(!valid){

      return res.status(400).json({

        success: false,

        error:
          "Payment verification failed"

      });

    }


    /* =========================
       FIND PAYMENT
    ========================= */

    const payment =
      db.prepare(`
        SELECT *
        FROM kumkum_payments
        WHERE razorpay_order_id = ?
      `).get(
        razorpay_order_id
      );


    if(!payment){

      return res.status(404).json({

        success: false,

        error:
          "Kumkum payment record not found"

      });

    }


    /* =========================
       DUPLICATE PROTECTION
    ========================= */

    if(
      payment.payment_status ===
      "paid"
    ){

      return res.json({

        success: true,

        message:
          "Payment already verified"

      });

    }


    /* =========================
       MARK AS PAID
    ========================= */

    db.prepare(`
      UPDATE kumkum_payments

      SET
        payment_status = 'paid',
        razorpay_payment_id = ?

      WHERE razorpay_order_id = ?
    `).run(

      razorpay_payment_id,

      razorpay_order_id

    );


    /* =========================
       GOOGLE SHEETS
    ========================= */

    try{

      await appendRow(
        "Kumkum Pooja",
        [

          payment.name,

          payment.phone,

          payment.email,

          payment.amount,

          razorpay_payment_id,

          new Date().toISOString()

        ]
      );


    }catch(sheetError){

      console.error(
        "Kumkum Google Sheets error:",
        sheetError.message
      );

    }


    /* =========================
       SUCCESS
    ========================= */

    return res.json({

      success: true,

      message:
        "Kumkum Pooja payment verified successfully"

    });


  }catch(error){

    console.error(
      "Kumkum payment verification error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Unable to verify Kumkum Pooja payment"

    });

  }

};
exports.resetPoojaRegistrations = (req, res) => {

  const key = req.headers["x-cleanup-key"];

  if(key !== process.env.CLEANUP_KEY){
    return res.status(403).json({
      error: "Forbidden"
    });
  }

  const result = db
    .prepare("DELETE FROM pooja_registrations")
    .run();

  return res.json({
    success: true,
    deleted: result.changes
  });
};