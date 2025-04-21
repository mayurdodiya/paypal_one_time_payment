const express = require("express");

const router = express.Router();

/** Normal user routes */
router.use("/auth", require("./auth.route"));

module.exports = router;
