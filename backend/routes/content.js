const router = require("express").Router();
const content = require("../controllers/contentController");

router.get("/config", content.getConfig);
router.get("/events", content.getEvents);

module.exports = router;