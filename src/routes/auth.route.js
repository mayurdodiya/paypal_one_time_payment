const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/paypalPaymentLink", authController.paypalPaymentLink);
router.get("/paypalsuccess", authController.paypalsuccess);
router.get("/paypalcancel", authController.paypalcancel);

router.post("/paypalOn", authController.paypalOn);
router.post("/paypalDemoAsOralense", authController.paypalDemoAsOralense);

// us app webhook => https://brpmpr08-3001.inc1.devtunnels.ms/api/v1/auth/webhook/us_bussiness_app
// rejoice bussiness acc us right
router.post('/webhook/us_bussiness_app', authController.webhook)


module.exports = router;