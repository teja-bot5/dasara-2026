/* chanda.js: Chanda package selection + Razorpay checkout */


/* =========================
   CHANDA PACKAGES
========================= */

var CHANDA_PACKAGES = [501, 1001, 2501, 5001, 10001];


function renderChanda(){

  var pk = $("pk");

  if(!pk) return;

  pk.innerHTML = CHANDA_PACKAGES.map(function(amount){

    return '<button type="button" data-a="' + amount + '">₹' +
      amount.toLocaleString("en-IN") +
      '</button>';

  }).join("");

}


/* =========================
   PACKAGE SELECTION
========================= */

$("pk").onclick = function(e){

  var b = e.target.closest("button[data-a]");

  if(!b) return;

  var amount = +b.dataset.a;

  if($("ca")){
    $("ca").value = amount;
  }

  document.querySelectorAll("#pk button").forEach(function(btn){

    btn.classList.remove("selected");

  });

  b.classList.add("selected");

};


/* =========================
   CHANDA SUBMISSION
========================= */

$("cb").onclick = async function(){

  var amount = $("ca").value.trim();
  var name = $("cn").value.trim();
  var family = $("cf").value.trim();
  var gothram = $("cg").value.trim();
  var phone = $("cp").value.trim();
  var email = $("ce").value.trim();

  var msg = $("cm");


  /* -------------------------
     Validation
  ------------------------- */

  if(!amount){

    msg.textContent =
      "Please select or enter a chanda amount.";

    return;

  }


  var numericAmount = Number(amount);


  if(!Number.isFinite(numericAmount) || numericAmount < 1){

    msg.textContent =
      "Please enter a valid amount.";

    return;

  }


  if(!name || !phone){

    msg.textContent =
      "Please enter your name and phone number.";

    return;

  }


  if(!/^[0-9]{10}$/.test(phone)){

    msg.textContent =
      "Please enter a valid 10-digit phone number.";

    return;

  }


  /* -------------------------
     Preparing payment
  ------------------------- */

  msg.textContent =
    "Preparing payment...";

  $("cb").disabled = true;


  try{

    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    var response = await fetch(
      "/api/chanda/create",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          amount: numericAmount,

          name: name,

          family_members: family,

          gothram: gothram,

          phone: phone,

          email: email

        })

      }
    );


    var data = await response.json();


    if(!response.ok || !data.success){

      throw new Error(
        data.error ||
        "Unable to create payment"
      );

    }


    /* =========================
       RAZORPAY CHECKOUT
    ========================= */

    var options = {

      key: data.key_id,

      amount: data.amount,

      currency: data.currency,

      name: "Dasara 2026 · Vijayawada",

      description: "Chanda Contribution",

      order_id: data.order_id,


      /* -------------------------
         Customer details
      ------------------------- */

      prefill: {

        name: name,

        email: email,

        contact: phone

      },


      /* -------------------------
         Internal reference
      ------------------------- */

      notes: {

        chanda_id: String(data.id)

      },


      /* -------------------------
         Theme
      ------------------------- */

      theme: {

        color: "#9D422D"

      },


      /* =========================
         PAYMENT SUCCESS
      ========================= */

      handler: async function(paymentResponse){

        console.log(
          "Razorpay payment response:",
          paymentResponse
        );


        msg.textContent =
          "Payment received. Verifying payment...";


        try{

          /* -------------------------
             Verify payment on backend
          ------------------------- */

          var verifyResponse = await fetch(
            "/api/chanda/verify",
            {

              method: "POST",

              headers: {
                "Content-Type": "application/json"
              },

              body: JSON.stringify({

                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature

              })

            }
          );


          var verifyData =
            await verifyResponse.json();


          /* -------------------------
             Verification failed
          ------------------------- */

          if(
            !verifyResponse.ok ||
            !verifyData.success
          ){

            throw new Error(
              verifyData.error ||
              "Payment verification failed"
            );

          }


          /* -------------------------
             Payment verified
          ------------------------- */

          msg.textContent =
            "Payment successful! Thank you for your contribution.";


          $("cb").disabled = false;


        }catch(err){

          console.error(
            "Payment verification error:",
            err
          );


          msg.textContent =
            "Payment was received, but verification failed. Please contact the committee.";


          $("cb").disabled = false;

        }

      },


      /* =========================
         CHECKOUT CLOSED
      ========================= */

      modal: {

        ondismiss: function(){

          msg.textContent =
            "Payment cancelled.";

          $("cb").disabled = false;

        }

      }

    };


    /* -------------------------
       Create Razorpay instance
    ------------------------- */

    var rzp = new Razorpay(options);


    /* =========================
       PAYMENT FAILED
    ========================= */

    rzp.on(
      "payment.failed",
      function(response){

        console.error(
          "Razorpay payment failed:",
          response.error
        );


        msg.textContent =
          "Payment failed. Please try again.";


        $("cb").disabled = false;

      }
    );


    /* -------------------------
       Open checkout
    ------------------------- */

    rzp.open();


  }catch(err){

    console.error(
      "Chanda payment error:",
      err
    );


    msg.textContent =
      err.message ||
      "Something went wrong. Please try again.";


    $("cb").disabled = false;

  }

};


/* =========================
   INITIAL LOAD
========================= */

renderChanda();