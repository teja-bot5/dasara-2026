const router = require("express").Router();

const chanda = require("../controllers/chandaController");

router.post("/create", chanda.create);

router.post("/verify", chanda.verify);

module.exports = router;