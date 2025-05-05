const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// OPTION : 1 WITHOUT WEBHOOK (using rest api)=========================================================
router.post("/paypalDemoWithoutWebhook", authController.paypalDemoWithoutWebhook);
router.post("/capturePayment", authController.capturePayment);


// OPTION : 2 WITH WEBHOOK (using rest api)============================================================
router.post("/paypalDemoWithWebhook", authController.paypalDemoWithWebhook);
router.post("/webhook", authController.webhook);
router.get("/checkpayment", authController.checkpayment);


// OPTION : 3
router.post("/paypalPaymentLink", authController.paypalPaymentLink);


// success/cancel redirect url
router.get("/paypalsuccess", authController.paypalsuccess);
router.get("/paypalcancel", authController.paypalcancel);


// webhook example
// us app webhook =>  https://brpmpr08-3001.inc1.devtunnels.ms/v1/auth/webhook

module.exports = router;
