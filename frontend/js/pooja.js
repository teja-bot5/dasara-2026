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

    var response =
      await fetch("/api/pooja/slots");

    if(!response.ok){
      throw new Error("Failed to load slots");
    }

    var data =
      await response.json();

    if(Array.isArray(data.booked)){

      booked = data.booked;

    }

    /*
       Festival data is loaded asynchronously
       by app.js.

       If N/start are not ready yet,
       app.js will call slots() again
       after loading festival data.
    */

    if(
      Array.isArray(N) &&
      N.length &&
      start
    ){

      slots();

    }

  }catch(err){

    console.error(
      "Could not load pooja slots:",
      err
    );

    /*
       Do not call slots() here if festival
       data has not loaded yet.
    */

    if(
      Array.isArray(N) &&
      N.length &&
      start
    ){

      slots();

    }

  }

}


/* -------------------------
   Daily Pooja Slots
------------------------- */

function slots(){

  /*
     app.js loads N and start asynchronously.

     Prevent N.map() from running before
     festival data is ready.
  */

  if(
    !Array.isArray(N) ||
    !N.length ||
    !start
  ){

    return;

  }


  var now = new Date();


  $("slots").innerHTML =
    N.map(function(n,i){

      var d =
        new Date(start);


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

        st =
          "Registration closed";

        cls =
          "no";

        dis =
          true;

      }else if(left <= 0){

        st =
          "Filled for today";

        cls =
          "no";

        dis =
          true;

      }else{

        st =
          left +
          (left > 1
            ? " places"
            : " place") +
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


  $("prSubmit").disabled =
    true;


  try{

    var response =
      await fetch(
        "/api/pooja/register",
        {

          method:
            "POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

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


      $("prName").value =
        "";

      $("prPhone").value =
        "";

      $("prMsg").textContent =
        "";

      $("prSubmit").disabled =
        false;

    },1800);


  }catch(err){

    console.error(err);


    msg.textContent =
      err.message ||
      "Something went wrong. Please try again.";


    $("prSubmit").disabled =
      false;

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

var KUMKUM_FEE =
  501;


var KUMKUM_UPI_ID =
  "6304569767@kotakbank";


var KUMKUM_PAYEE_NAME =
  "Dasara 2026";


/* -------------------------
   Create UPI Link
------------------------- */

function createKumkumUpiLink(){

  var params =
    new URLSearchParams({

      pa:
        KUMKUM_UPI_ID,

      pn:
        KUMKUM_PAYEE_NAME,

      am:
        KUMKUM_FEE.toFixed(2),

      cu:
        "INR",

      tn:
        "Dasara 2026 Kumkum Pooja"

    });


  return "upi://pay?" +
    params.toString();

}


/* -------------------------
   Create Payment UI
------------------------- */

function createKumkumPaymentBox(){

  var existing =
    $("kumkumPaymentBox");


  if(existing){

    return existing;

  }


  var box =
    document.createElement("div");


  box.id =
    "kumkumPaymentBox";


  box.style.cssText = `
    margin-top:24px;
    padding-top:24px;
    border-top:1px solid rgba(0,0,0,.08);
    text-align:center;
  `;


  box.innerHTML = `

    <h3>
      Complete Payment
    </h3>

    <p>
      Pay ₹501 using your UPI app or scan the QR code.
    </p>


    <div
      id="kumkumQr"
      style="
        display:flex;
        justify-content:center;
        margin:20px 0;
      "
    ></div>


    <p
      style="
        margin:8px 0;
        font-weight:600;
      "
    >
      ₹501
    </p>


    <p
      style="
        font-size:13px;
        color:var(--sub);
        word-break:break-all;
      "
    >
      ${KUMKUM_UPI_ID}
    </p>


    <a
      id="kumkumUpiBtn"
      href="#"
      class="btn"
      style="
        display:inline-block;
        margin-top:10px;
        text-decoration:none;
      "
    >
      Pay with UPI
      <i>→</i>
    </a>


    <p
      style="
        margin-top:22px;
        font-size:13px;
      "
    >
      After completing the payment,
      enter your UTR / Transaction ID.
    </p>


    <label for="kumkumUtr">
      UTR / Transaction ID
    </label>


    <input
      id="kumkumUtr"
      type="text"
      autocomplete="off"
      placeholder="Enter UTR / Transaction ID"
    >


    <button
      class="btn"
      id="kumkumSubmitPayment"
      type="button"
      style="margin-top:12px"
    >
      Submit Payment
      <i>→</i>
    </button>


    <div
      class="msg"
      id="kumkumPaymentMsg"
    ></div>

  `;


  $("kumkumPooja")
    .appendChild(box);


  return box;

}


/* -------------------------
   Generate QR
------------------------- */

function generateKumkumQr(){

  var qrBox =
    $("kumkumQr");


  if(!qrBox) return;


  qrBox.innerHTML =
    "";


  if(typeof QRCode === "undefined"){

    qrBox.innerHTML =
      `
        <p style="color:var(--sub)">
          QR code could not be loaded.
          Please use the UPI button.
        </p>
      `;

    return;

  }


  new QRCode(qrBox, {

    text:
      createKumkumUpiLink(),

    width:
      220,

    height:
      220,

    correctLevel:
      QRCode.CorrectLevel.M

  });

}


/* -------------------------
   Show Payment Box
------------------------- */

function showKumkumPayment(){

  var box =
    createKumkumPaymentBox();


  var upiButton =
    $("kumkumUpiBtn");


  if(upiButton){

    upiButton.href =
      createKumkumUpiLink();

  }


  generateKumkumQr();


  box.scrollIntoView({

    behavior:
      "smooth",

    block:
      "center"

  });


  bindKumkumPaymentSubmit();

}


/* -------------------------
   Submit UTR
------------------------- */

function bindKumkumPaymentSubmit(){

  var submit =
    $("kumkumSubmitPayment");


  if(!submit) return;


  /*
     Prevent binding the same button
     multiple times.
  */

  if(submit.dataset.bound === "true"){

    return;

  }


  submit.dataset.bound =
    "true";


  submit.onclick =
    async function(){

      var name =
        $("kn").value.trim();


      var phone =
        $("kp").value.trim();


      var utrInput =
        $("kumkumUtr");


      var msg =
        $("kumkumPaymentMsg");


      var utr =
        utrInput.value.trim();


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


      if(!/^[A-Za-z0-9]{6,30}$/.test(utr)){

        msg.textContent =
          "Please enter a valid UTR / Transaction ID.";

        return;

      }


      submit.disabled =
        true;


      submit.textContent =
        "Submitting...";


      msg.textContent =
        "";


      try{

        var response =
          await fetch(
            "/api/pooja/kumkum/submit",
            {

              method:
                "POST",

              headers:{
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({

                  name:
                    name,

                  phone:
                    phone,

                  email:
                    "",

                  utr:
                    utr

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
            "Unable to submit payment details."
          );

        }


        msg.textContent =
          "Payment details submitted successfully. Your payment is Pending Verification by the committee.";


        submit.textContent =
          "Submitted";


        $("kn").value =
          "";

        $("kp").value =
          "";

        utrInput.value =
          "";


      }catch(err){

        console.error(
          "Kumkum payment submission error:",
          err
        );


        msg.textContent =
          err.message ||
          "Something went wrong. Please try again.";


        submit.disabled =
          false;


        submit.textContent =
          "Submit Payment";

      }

    };

}


/* -------------------------
   Kumkum Start Payment
------------------------- */

$("kb").onclick = function(){

  var name =
    $("kn").value.trim();


  var phone =
    $("kp").value.trim();


  var msg =
    $("km");


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
    "";


  $("kb").disabled =
    true;


  $("kb").textContent =
    "Payment Ready";


  showKumkumPayment();

};


/* =========================
   INITIAL LOAD
========================= */

loadBooked();