const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// OPTION : 1
router.post("/paypalDemoWithoutWebhook", authController.paypalDemoWithoutWebhook);
router.post("/capturePayment", authController.capturePayment);


// OPTION : 2
router.post("/paypalDemoWithWebhook", authController.paypalDemoWithWebhook);
router.post("/webhook", authController.webhook);
router.post("/checkpayment", authController.checkpayment);


// OPTION : 3
router.post("/paypalPaymentLink", authController.paypalPaymentLink);


// success/cancel redirect url
router.get("/paypalsuccess", authController.paypalsuccess);
router.get("/paypalcancel", authController.paypalcancel);


// webhook example
// us app webhook =>  https://162c-2405-201-200d-115e-8611-16d9-c6c0-2895.ngrok-free.app/v1/auth/webhook/us_bussiness_app

module.exports = router;
