/* chanda.js
   Chanda contribution:
   UPI QR + UPI app + UTR submission
*/

(function () {

  var UPI_ID = "6304569767@kotakbank";
  var PAYEE_NAME = "Dasara 2026";

  var CHANDA_PACKAGES = [
    501,
    1001,
    2501,
    5001,
    10001
  ];


  /* =========================
     ELEMENTS
  ========================= */

  var pk = $("pk");
  var amountInput = $("ca");

  var nameInput = $("cn");
  var familyInput = $("cf");
  var gothramInput = $("cg");
  var phoneInput = $("cp");
  var emailInput = $("ce");

  var startPaymentBtn =
    $("startChandaPayment");

  var startPaymentRow =
    $("startPaymentRow");

  var paymentBox =
    $("paymentBox");

  var paymentAmount =
    $("paymentAmount");

  var qrBox =
    $("chandaQr");

  var upiPayBtn =
    $("upiPayBtn");

  var utrInput =
    $("cutr");

  var submitBtn =
    $("cb");

  var message =
    $("cm");


  /* =========================
     PACKAGES
  ========================= */

  function renderChanda() {

    if (!pk) return;

    pk.innerHTML =
      CHANDA_PACKAGES.map(function (amount) {

        return (
          '<button type="button" data-a="' +
          amount +
          '">₹' +
          amount.toLocaleString("en-IN") +
          '</button>'
        );

      }).join("");

  }


  /* =========================
     PACKAGE SELECTION
  ========================= */

  if (pk) {

    pk.onclick = function (e) {

      var button =
        e.target.closest("button[data-a]");

      if (!button) return;

      var amount =
        Number(button.dataset.a);

      if (amountInput) {
        amountInput.value = amount;
      }

      document
        .querySelectorAll("#pk button")
        .forEach(function (btn) {

          btn.classList.remove("selected");

        });

      button.classList.add("selected");

    };

  }


  /* =========================
     MESSAGE
  ========================= */

  function showMessage(text) {

    if (message) {
      message.textContent = text;
    }

  }


  /* =========================
     UPI LINK
  ========================= */

  function createUpiLink(amount) {

    var params =
      new URLSearchParams({

        pa: UPI_ID,

        pn: PAYEE_NAME,

        am: Number(amount).toFixed(2),

        cu: "INR",

        tn: "Dasara 2026 Chanda"

      });

    return "upi://pay?" + params.toString();

  }


  /* =========================
     QR CODE
  ========================= */

  function generateQr(amount) {

    if (!qrBox) return;

    qrBox.innerHTML = "";

    var upiLink =
      createUpiLink(amount);


    if (typeof QRCode === "undefined") {

      qrBox.innerHTML =
        '<p style="color:var(--sub)">' +
        'QR code could not be loaded. ' +
        'Please use the UPI button.' +
        '</p>';

      return;

    }


    new QRCode(qrBox, {

      text: upiLink,

      width: 220,

      height: 220,

      correctLevel:
        QRCode.CorrectLevel.M

    });

  }


  /* =========================
     VALIDATION
  ========================= */

  function validateDetails() {

    var amount =
      Number(amountInput.value);

    var name =
      nameInput.value.trim();

    var family =
      familyInput.value.trim();

    var gothram =
      gothramInput.value.trim();

    var phone =
      phoneInput.value.trim();

    var email =
      emailInput.value.trim();


    if (!amount || amount < 1) {

      showMessage(
        "Please select or enter a valid contribution amount."
      );

      return false;

    }


    if (!name) {

      showMessage(
        "Please enter your name."
      );

      return false;

    }


    if (!family) {

      showMessage(
        "Please enter family member names."
      );

      return false;

    }


    if (!gothram) {

      showMessage(
        "Please enter your gothram."
      );

      return false;

    }


    if (!/^[0-9]{10}$/.test(phone)) {

      showMessage(
        "Please enter a valid 10-digit phone number."
      );

      return false;

    }


    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

      showMessage(
        "Please enter a valid email address."
      );

      return false;

    }


    return true;

  }


  /* =========================
     CONTINUE TO PAYMENT
  ========================= */

  if (startPaymentBtn) {

    startPaymentBtn.onclick = function () {

      showMessage("");

      if (!validateDetails()) {
        return;
      }


      var amount =
        Number(amountInput.value);


      paymentAmount.textContent =
        amount.toLocaleString("en-IN");


      upiPayBtn.href =
        createUpiLink(amount);


      generateQr(amount);


      paymentBox.style.display =
        "block";

      startPaymentRow.style.display =
        "none";


      paymentBox.scrollIntoView({

        behavior: "smooth",

        block: "center"

      });

    };

  }


  /* =========================
     SUBMIT UTR
  ========================= */

  if (submitBtn) {

    submitBtn.onclick = async function () {

      showMessage("");


      if (!validateDetails()) {
        return;
      }


      var utr =
        utrInput.value.trim();


      if (!/^[A-Za-z0-9]{6,30}$/.test(utr)) {

        showMessage(
          "Please enter a valid UTR / Transaction ID."
        );

        return;

      }


      var payload = {

        amount:
          Number(amountInput.value),

        name:
          nameInput.value.trim(),

        family_members:
          familyInput.value.trim(),

        gothram:
          gothramInput.value.trim(),

        phone:
          phoneInput.value.trim(),

        email:
          emailInput.value.trim(),

        utr:
          utr

      };


      submitBtn.disabled = true;

      submitBtn.textContent =
        "Submitting...";


      try {

        var response =
          await fetch(
            "/api/chanda/submit",
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)

            }
          );


        var data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.error ||
            "Unable to submit payment."
          );

        }


        showMessage(
          "Payment details submitted successfully. Your payment is Pending Verification by the committee."
        );


        paymentBox.style.display =
          "none";


        submitBtn.textContent =
          "Submitted";


      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Something went wrong. Please try again."
        );


        submitBtn.disabled =
          false;

        submitBtn.textContent =
          "Submit Payment";

      }

    };

  }


  /* =========================
     INITIAL LOAD
  ========================= */

  renderChanda();

})();