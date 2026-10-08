const router = require("express").Router();

const pooja =
  require("../controllers/poojaController");


/* =========================
   DAILY POOJA
========================= */

router.get(
  "/slots",
  pooja.getSlots
);

router.post(
  "/register",
  pooja.register
);


/* =========================
   KUMKUM POOJA
========================= */

router.post(
  "/kumkum/submit",
  pooja.submitKumkum
);


module.exports = router;