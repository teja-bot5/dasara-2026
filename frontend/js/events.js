/* events.js: Dasara Avataralu cards */

var ICON = ["fl", "di", "lo"];


/* =========================
   RENDER EVENTS
========================= */

function renderEvents() {

  if (!Array.isArray(EV)) {
    return;
  }

  $("days").innerHTML = EV.map(function(e, i) {

    var d = new Date(start);

    d.setDate(d.getDate() + i);


    /* -------------------------
       Decorative icon
    ------------------------- */

    var ic = ICON[i % 3];

    var vb =
      ic == "fl"
        ? "0 0 40 40"
        : ic == "di"
          ? "0 0 60 56"
          : "0 0 80 50";


    /* -------------------------
       Event card
    ------------------------- */

    return `
      <article
        class="day"
        style="--t:${e.color[0]};--c:${e.color[1]}"
      >

        <div class="cutw">

          <svg viewBox="${vb}">
            <use href="#${ic}"></use>
          </svg>

        </div>


        <div class="bd">

          <!-- Day at top -->

          <div class="k">
            Day ${e.day}
          </div>


          <!-- Avatar name -->

          <h3>
            ${e.name}
          </h3>


          <!-- Avatar image area -->

          <div class="avatar-photo">
            ${
              e.image
                ? `<img
                    src="${e.image}"
                    alt="${e.name}"
                    loading="lazy"
                  >`
                : ""
            }
          </div>


          <!-- Date at bottom -->

          <div class="avatar-day">
            ${fmt(d)}
          </div>

        </div>

      </article>
    `;

  }).join("");


  /*
    Re-observe cards after rendering.
    This keeps the existing beginning animation.
  */

  if (typeof obs === "function") {
    obs();
  }

}


/* =========================
   CARD OBSERVER / ANIMATION
========================= */

var io;


function obs() {

  if (io) {
    io.disconnect();
  }


  io = new IntersectionObserver(
    function(es) {

      es.forEach(function(e) {

        e.target.classList.toggle(
          "in",
          e.isIntersecting
        );

      });

    },
    {
      root: $("days"),
      threshold: 0.7
    }
  );


  document
    .querySelectorAll(".day")
    .forEach(function(d) {

      io.observe(d);

    });

}