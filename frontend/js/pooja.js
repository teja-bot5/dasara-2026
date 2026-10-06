/* pooja.js: daily pooja registration + Kumkum Pooja */


/* =========================
   DAILY POOJA
========================= */

var booked = [0,0,0,0,0,0,0,0,0,0];

var selectedDay = null;


/* -------------------------
   Load booked counts
------------------------- */

async function loadBooked(){

  try{

    var response = await fetch("/api/pooja/slots");

    if(!response.ok){
      throw new Error("Failed to load slots");
    }

    var data = await response.json();

    if(Array.isArray(data.booked)){

      booked = data.booked;

    }

    slots();

  }catch(err){

    console.error(
      "Could not load pooja slots:",
      err
    );

    slots();

  }

}


/* -------------------------
   Daily Pooja Slots
------------------------- */

function slots(){

  var now = new Date();

  $("slots").innerHTML = N.map(function(n,i){

    var d = new Date(start);

    d.setDate(
      d.getDate() + i
    );


    var closed =
      (d - now) < 48 * 36e5;


    var left =
      3 - (booked[i] || 0);


    var st;

    var cls = "";

    var dis = false;


    if(closed){

      st = "Registration closed";

      cls = "no";

      dis = true;

    }else if(left <= 0){

      st = "Filled for today";

      cls = "no";

      dis = true;

    }else{

      st =
        left +
        (left > 1 ? " places" : " place") +
        " available";

    }


    return `
      <div class="slot">

        <div>

          <b style="font-weight:500">
            Day ${i+1} · ${fmt(d)}
          </b>

          <div class="tag ${cls}">
            ${st}
          </div>

        </div>

        <button
          class="btn alt"
          ${dis ? "disabled" : ""}
          data-i="${i}">
          Register
        </button>

      </div>
    `;

  }).join("");

}


/* -------------------------
   Open Daily Pooja Popup
------------------------- */

$("slots").onclick = function(e){

  var b =
    e.target.closest(
      "button[data-i]"
    );

  if(!b || b.disabled) return;


  selectedDay =
    +b.dataset.i;


  $("piTitle").textContent =
    "Day " +
    (selectedDay + 1) +
    " · " +
    N[selectedDay];


  $("poojaInfo").setAttribute(
    "aria-hidden",
    "false"
  );

};


/* -------------------------
   Info Popup
------------------------- */

$("piCancel").onclick = function(){

  $("poojaInfo").setAttribute(
    "aria-hidden",
    "true"
  );

};


$("piContinue").onclick = function(){

  if(selectedDay === null) return;


  $("poojaInfo").setAttribute(
    "aria-hidden",
    "true"
  );


  $("prTitle").textContent =
    "Day " +
    (selectedDay + 1) +
    " · " +
    N[selectedDay];


  $("poojaForm").setAttribute(
    "aria-hidden",
    "false"
  );

};


/* -------------------------
   Registration Form
------------------------- */

$("prCancel").onclick = function(){

  $("poojaForm").setAttribute(
    "aria-hidden",
    "true"
  );

};


$("prSubmit").onclick = async function(){

  var name =
    $("prName").value.trim();


  var phone =
    $("prPhone").value.trim();


  var msg =
    $("prMsg");


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


  msg.textContent =
    "Submitting registration...";


  $("prSubmit").disabled = true;


  try{

    var response =
      await fetch(
        "/api/pooja/register",
        {

          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            day:
              selectedDay + 1,

            name:
              name,

            phone:
              phone

          })

        }
      );


    var data =
      await response.json();


    if(
      !response.ok ||
      !data.success
    ){

      throw new Error(
        data.error ||
        "Registration failed"
      );

    }


    msg.textContent =
      "Registration successful! Your place has been reserved.";


    await loadBooked();


    setTimeout(function(){

      $("poojaForm").setAttribute(
        "aria-hidden",
        "true"
      );


      $("prName").value = "";

      $("prPhone").value = "";

      $("prMsg").textContent = "";

      $("prSubmit").disabled = false;


    },1800);


  }catch(err){

    console.error(err);


    msg.textContent =
      err.message ||
      "Something went wrong. Please try again.";


    $("prSubmit").disabled = false;

  }

};


/* -------------------------
   Close Daily Pooja Modals
------------------------- */

$("poojaInfo").onclick = function(e){

  if(e.target === this){

    this.setAttribute(
      "aria-hidden",
      "true"
    );

  }

};


$("poojaForm").onclick = function(e){

  if(e.target === this){

    this.setAttribute(
      "aria-hidden",
      "true"
    );

  }

};


/* =====================================================
   KUMKUM POOJA
===================================================== */

var KUMKUM_FEE = 501;


/* -------------------------
   Kumkum Payment
------------------------- */

$("kb").onclick = async function(){

  var name =
    $("kn").value.trim();


  var phone =
    $("kp").value.trim();


  var msg =
    $("km");


  /* -------------------------
     Validation
  ------------------------- */

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
     Preparing
  ------------------------- */

  msg.textContent =
    "Preparing payment...";


  $("kb").disabled = true;


  try{

    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    var response =
      await fetch(
        "/api/pooja/kumkum/create",
        {

          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            name:name,

            phone:phone,

            email:""

          })

        }
      );


    var data =
      await response.json();


    if(
      !response.ok ||
      !data.success
    ){

      throw new Error(
        data.error ||
        "Unable to create payment"
      );

    }


    /* =========================
       RAZORPAY CHECKOUT
    ========================= */

    var options = {

      key:
        data.key_id,


      amount:
        data.amount,


      currency:
        data.currency,


      name:
        "Dasara 2026 · Vijayawada",


      description:
        "Kumkum Pooja",


      order_id:
        data.order_id,


      prefill:{

        name:name,

        contact:phone

      },


      notes:{

        pooja:
          "Kumkum Pooja",

        amount:
          String(KUMKUM_FEE)

      },


      theme:{

        color:"#9D422D"

      },


      /* -------------------------
         Payment success
      ------------------------- */

      handler:
        async function(paymentResponse){

          msg.textContent =
            "Payment received. Verifying payment...";


          try{

            var verifyResponse =
              await fetch(
                "/api/pooja/kumkum/verify",
                {

                  method:"POST",

                  headers:{
                    "Content-Type":
                      "application/json"
                  },

                  body:JSON.stringify({

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


            if(
              !verifyResponse.ok ||
              !verifyData.success
            ){

              throw new Error(
                verifyData.error ||
                "Payment verification failed"
              );

            }


            msg.textContent =
              "Kumkum Pooja registration successful!";


            $("kn").value = "";

            $("kp").value = "";


          }catch(err){

            console.error(
              "Kumkum verification error:",
              err
            );


            msg.textContent =
              "Payment was received, but verification failed. Please contact the committee.";

          }


          $("kb").disabled = false;

        },


      /* -------------------------
         Payment cancelled
      ------------------------- */

      modal:{

        ondismiss:function(){

          msg.textContent =
            "Payment cancelled.";

          $("kb").disabled = false;

        }

      }

    };


    /* -------------------------
       Create Razorpay instance
    ------------------------- */

    var rzp =
      new Razorpay(options);


    /* -------------------------
       Payment failed
    ------------------------- */

    rzp.on(
      "payment.failed",
      function(response){

        console.error(
          "Kumkum payment failed:",
          response.error
        );


        msg.textContent =
          "Payment failed. Please try again.";


        $("kb").disabled = false;

      }
    );


    rzp.open();


  }catch(err){

    console.error(
      "Kumkum payment error:",
      err
    );


    msg.textContent =
      err.message ||
      "Something went wrong. Please try again.";


    $("kb").disabled = false;

  }

};


/* =========================
   INITIAL LOAD
========================= */

loadBooked();