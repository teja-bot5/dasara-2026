const db = require("../database");
const { appendRow } = require("../googleSheets");


/* =========================
   SUBMIT CHANDA PAYMENT
   UPI + UTR
========================= */

exports.submit = async (req, res) => {

  const {
    amount,
    name,
    family_members,
    gothram,
    phone,
    email,
    utr
  } = req.body;


  /* =========================
     VALIDATION
  ========================= */

  if(!amount || !name || !phone || !utr){

    return res.status(400).json({
      success: false,
      error: "Amount, name, phone and UTR are required"
    });

  }


  const numericAmount = Number(amount);


  if(
    !Number.isFinite(numericAmount) ||
    numericAmount < 1
  ){

    return res.status(400).json({
      success: false,
      error: "Invalid amount"
    });

  }


  const cleanName =
    name.trim();

  const cleanFamily =
    family_members
      ? family_members.trim()
      : "";

  const cleanGothram =
    gothram
      ? gothram.trim()
      : "";

  const cleanPhone =
    phone.trim();

  const cleanEmail =
    email
      ? email.trim()
      : "";

  const cleanUtr =
    utr.trim();


  if(!/^[0-9]{10}$/.test(cleanPhone)){

    return res.status(400).json({
      success: false,
      error: "Please enter a valid 10-digit phone number"
    });

  }


  /*
     UTR / Transaction ID

     Accepts common numeric and
     alphanumeric UTR formats.
  */

  if(!/^[A-Za-z0-9]{6,30}$/.test(cleanUtr)){

    return res.status(400).json({
      success: false,
      error: "Please enter a valid UTR / Transaction ID"
    });

  }


  try{

    /* =========================
       DUPLICATE UTR CHECK
    ========================= */

    const existing =
      db.prepare(`
        SELECT id
        FROM chanda_payments
        WHERE utr = ?
      `).get(cleanUtr);


    if(existing){

      return res.status(409).json({
        success: false,
        error: "This UTR has already been submitted"
      });

    }


    /* =========================
       SAVE TO SQLITE
    ========================= */

    const result =
      db.prepare(`
        INSERT INTO chanda_payments (
          amount,
          name,
          family_members,
          gothram,
          phone,
          email,
          payment_status,
          utr
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(

        numericAmount,

        cleanName,

        cleanFamily,

        cleanGothram,

        cleanPhone,

        cleanEmail,

        "Pending Verification",

        cleanUtr

      );


    /* =========================
       SAVE TO GOOGLE SHEETS
    ========================= */

    try{

      await appendRow(
        "Chanda",
        [

          new Date().toISOString(),

          numericAmount,

          cleanName,

          cleanFamily,

          cleanGothram,

          cleanPhone,

          cleanEmail,

          "Pending Verification",

          cleanUtr

        ]
      );


    }catch(sheetError){

      /*
         Sheets failed.

         Remove the SQLite record so
         the user can safely submit again.
      */

      db.prepare(`
        DELETE FROM chanda_payments
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
          "Payment details could not be saved. Please try again."

      });

    }


    /* =========================
       SUCCESS
    ========================= */

    return res.status(201).json({

      success: true,

      id: result.lastInsertRowid,

      payment_status:
        "Pending Verification",

      message:
        "Payment details submitted successfully. Your payment is Pending Verification by the committee."

    });


  }catch(err){

    console.error(
      "Chanda submission error:",
      err
    );


    return res.status(500).json({

      success: false,

      error:
        "Unable to submit payment details"

    });

  }

};