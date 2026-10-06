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
   CREATE CHANDA PAYMENT
   + CREATE RAZORPAY ORDER
========================= */

exports.create = async (req, res) => {

  const {
    amount,
    name,
    family_members,
    gothram,
    phone,
    email
  } = req.body;


  /* -------------------------
     Validation
  ------------------------- */

  if(!amount || !name || !phone){

    return res.status(400).json({
      error: "Amount, name and phone are required"
    });

  }


  const numericAmount = Number(amount);


  if(
    !Number.isFinite(numericAmount) ||
    numericAmount < 1
  ){

    return res.status(400).json({
      error: "Invalid amount"
    });

  }


  if(!/^[0-9]{10}$/.test(phone.trim())){

    return res.status(400).json({
      error: "Please enter a valid 10-digit phone number"
    });

  }


  try{

    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    const order = await razorpay.orders.create({

      amount: Math.round(numericAmount * 100),

      currency: "INR",

      receipt: `chanda_${Date.now()}`,

      notes: {
        name: name.trim(),
        phone: phone.trim()
      }

    });


    /* =========================
       SAVE PENDING PAYMENT
    ========================= */

    const result = db.prepare(`
      INSERT INTO chanda_payments (
        amount,
        name,
        family_members,
        gothram,
        phone,
        email,
        payment_status,
        razorpay_order_id
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(

      numericAmount,

      name.trim(),

      family_members
        ? family_members.trim()
        : "",

      gothram
        ? gothram.trim()
        : "",

      phone.trim(),

      email
        ? email.trim()
        : "",

      order.id

    );


    /* =========================
       SEND ORDER TO FRONTEND
    ========================= */

    return res.status(201).json({

      success: true,

      id: result.lastInsertRowid,

      payment_status: "pending",

      order_id: order.id,

      amount: order.amount,

      currency: order.currency,

      key_id: process.env.RAZORPAY_KEY_ID

    });


  }catch(err){

    console.error(
      "Razorpay order creation error:",
      err
    );


    return res.status(500).json({
      error: "Unable to create payment order"
    });

  }

};


/* =========================
   VERIFY RAZORPAY PAYMENT
========================= */

exports.verify = async (req, res) => {

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


    /* =========================
       SAFE SIGNATURE COMPARISON
    ========================= */

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
       FIND CHANDA RECORD
    ========================= */

    const payment = db.prepare(`
      SELECT *
      FROM chanda_payments
      WHERE razorpay_order_id = ?
    `).get(
      razorpay_order_id
    );


    if(!payment){

      return res.status(404).json({

        success: false,

        error:
          "Chanda payment record not found"

      });

    }


    /* =========================
       DUPLICATE PROTECTION
    ========================= */

    if(
      payment.payment_status === "paid"
    ){

      return res.json({

        success: true,

        message:
          "Payment already verified"

      });

    }


    /* =========================
       UPDATE SQLITE
    ========================= */

    db.prepare(`
      UPDATE chanda_payments

      SET
        payment_status = 'paid',
        razorpay_payment_id = ?

      WHERE razorpay_order_id = ?
    `).run(

      razorpay_payment_id,

      razorpay_order_id

    );


    /* =========================
       SAVE TO GOOGLE SHEETS
    ========================= */

    try{

      await appendRow(
        "Chanda",
        [

          new Date().toISOString(),

          payment.amount,

          payment.name,

          payment.family_members,

          payment.gothram,

          payment.phone,

          payment.email,

          "paid",

          razorpay_order_id,

          razorpay_payment_id

        ]
      );


    }catch(sheetError){

      /*
         Payment is already marked as paid
         in SQLite.

         Log the Sheets error instead of
         telling the user that payment failed.
      */

      console.error(
        "Google Sheets error:",
        sheetError
      );

    }


    /* =========================
       SUCCESS
    ========================= */

    return res.json({

      success: true,

      message:
        "Payment verified successfully"

    });


  }catch(err){

    console.error(
      "Payment verification error:",
      err
    );


    return res.status(500).json({

      success: false,

      error:
        "Unable to verify payment"

    });

  }

};