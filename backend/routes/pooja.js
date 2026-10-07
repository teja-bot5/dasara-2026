const router = require("express").Router();

const pooja = require("../controllers/poojaController");


/* =========================
   DAILY POOJA
========================= */

router.get("/slots", pooja.getSlots);

router.post("/register", pooja.register);


/* =========================
   KUMKUM POOJA
========================= */

router.post(
  "/kumkum/create",
  pooja.createKumkum
);

router.post(
  "/kumkum/verify",
  pooja.verifyKumkum
);
router.post(
  "/cleanup-reset",
  pooja.resetPoojaRegistrations
);

module.exports = router;