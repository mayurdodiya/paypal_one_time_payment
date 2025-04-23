const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/paypalPaymentLink", authController.paypalPaymentLink);
router.get("/paypalsuccess", authController.paypalsuccess);
router.get("/paypalcancel", authController.paypalcancel);

router.post("/paypalOn", authController.paypalOn);
router.post("/paypalDemoAsOralense", authController.paypalDemoAsOralense);

// us app webhook =>  https://162c-2405-201-200d-115e-8611-16d9-c6c0-2895.ngrok-free.app/v1/auth/webhook/us_bussiness_app
// rejoice bussiness acc us right
router.post("/webhook/us_bussiness_app", authController.webhook);

module.exports = router;
