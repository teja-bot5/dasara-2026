const router = require("express").Router();

const chanda = require("../controllers/chandaController");

router.post("/submit", chanda.submit);

module.exports = router;