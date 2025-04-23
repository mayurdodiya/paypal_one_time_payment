// const paypal = require("../services/paypal");
const message = require("../json/message.json");
const { PaymenModel } = require("../models");
const apiResponse = require("../utils/api.response");
const axios = require("axios");
const fs = require("fs");

// file: createPayPalPayment.js
const paypal = require("@paypal/checkout-server-sdk");
// const paypal = require("@paypal/paypal-server-sdk");

// 1. Setup PayPal Environment (Sandbox or Live)
const environment = new paypal.core.SandboxEnvironment(
  process.env.CLIENT_ID, // Replace with your actual PayPal Client ID
  process.env.CLIENT_SECRET // Replace with your actual PayPal Secret
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  // create waiting loder in client side till payment_status not paid ( call api every 5 sec to check database status )
  webhook: async (req, res) => {
    try {
      const event = req.body;
      let capturePayment;

      if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
        // update payment table status as order.approved here
        // await PaymenModel.findOneAndUpdate({ orderId: obj.orderId }, { $set: obj }, { upsert: true, new: true });
        console.log(event, "--------------------------------------- CHECKOUT.ORDER.APPROVED event");

        const orderId = event?.resource?.id;
        const url = `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;

        // Generate access token
        const tokenResponse = await axios({
          url: `${process.env.PAYPAL_API}/v1/oauth2/token`,
          method: "post",
          data: "grant_type=client_credentials",
          auth: {
            username: process.env.CLIENT_ID,
            password: process.env.CLIENT_SECRET,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const accessToken = tokenResponse.data.access_token;

        // Manually capture payment
        const captureResponse = await axios({
          url: url,
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: {
            phoneNo: 9898989898,
            orderId: "degfrg8vbnu81gb811thb15",
            paymentId: "brgbvvfb48jty",
            amount: 1,
          },
        });

        capturePayment = captureResponse.data;
        console.log(captureResponse, "--------------------------------------- captureResponse call from order app");
        // fs.writeFileSync('xpaymentCaptureData.json', JSON.stringify(capturePayment, null, 2));
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        console.log(event, "------------------------------------------ PAYMENT.CAPTURE.COMPLETED");

        const custom_id = event?.resource?.custom_id;
        let userData;
        if (custom_id) {
          userData = JSON.parse(custom_id);
          const obj = {
            orderId: event.id,
            phoneNo: userData?.phoneNo,
            paymentId: userData?.paymentId,
            amount: 10,
          };
          // only update payment table as per orderId don't create new data
          // await PaymenModel.create(obj);
          // fs.writeFileSync('xpaymentCaptureWebhook.json', JSON.stringify(event, null, 2));
        }
      } else {
        console.log(event.event_type, "unknown event -----------------------------");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error(error.response?.data || error.message || error);
      res.status(500).send("Something went wrong");
    }
  },

  // final
  paypalDemoAsOralense: async (req, res) => {
    try {
      console.log("------------------------------------------ paypalDemoAsOralense");
      async function generatePaypalAccessToken() {
        const response = await axios({
          url: process.env.PAYPAL_API + "/v1/oauth2/token",
          method: "post",
          data: "grant_type=client_credentials",
          auth: {
            username: process.env.CLIENT_ID,
            password: process.env.CLIENT_SECRET,
          },
        });
        return response.data.access_token;
      }

      const accessToken = await generatePaypalAccessToken();
      console.log(accessToken, "------------------------------------------ accessToken");
      const url = `${process.env.PAYPAL_API}/v2/checkout/orders`;
      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: [
              {
                name: "Node.js Complete Course",
                description: "Node.js Complete Course with Express and MongoDB",
                quantity: 1,
                unit_amount: {
                  currency_code: "EUR",
                  value: "12.00",
                },
              },
            ],
            amount: {
              currency_code: "EUR",
              value: "12.00",
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: "12.00",
                },
              },
            },
            custom_id: JSON.stringify({
              phoneNo: 9898989898,
              orderId: "degfrg8vbnu81gb811thb15",
              paymentId: "brgbvvfb48jty",
              amount: 1,
            }),
          },
        ],
        application_context: {
          cancel_url: "http://localhost:3001/api/v1/auth/paypalcancel", // redirect on cancel
          return_url: "http://localhost:3001/api/v1/auth/paypalsuccess", // redirect after approval
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "manfra.io",
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const respData = await response.data;
      return res.status(200).json({ message: "order is success", data: respData });
    } catch (error) {
      console.log(error.message);
    }
  },

  // paypal demo as github lac
  paypalOn: async (req, res) => {
    try {
      async function generateAccessToken() {
        const response = await axios({
          url: process.env.PAYPAL_API + "/v1/oauth2/token",
          method: "post",
          data: "grant_type=client_credentials",
          auth: {
            username: process.env.CLIENT_ID,
            password: process.env.CLIENT_SECRET,
          },
        });

        return response.data.access_token;
      }

      const accessToken = await generateAccessToken();

      const response = await axios({
        url: process.env.PAYPAL_API + "/v2/checkout/orders",
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
        data: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              items: [
                {
                  name: "Node.js Complete Course",
                  description: "Node.js Complete Course with Express and MongoDB",
                  quantity: 1,
                  unit_amount: {
                    currency_code: "EUR",
                    value: "12.00",
                  },
                },
              ],
              amount: {
                currency_code: "EUR",
                value: "12.00",
                breakdown: {
                  item_total: {
                    currency_code: "EUR",
                    value: "12.00",
                  },
                },
              },
            },
          ],
          application_context: {
            cancel_url: "http://localhost:3001/api/v1/auth/paypalcancel", // redirect on cancel
            return_url: "http://localhost:3001/api/v1/auth/paypalsuccess", // redirect after approval
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            brand_name: "manfra.io",
          },
        }),
      });

      const final = response.data.links.find((link) => link.rel === "approve").href;

      return res.status(200).json({ message: "order is success", data: response.data.links });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: error.message });
    }
  },

  // paypal demo with only link
  paypalPaymentLink: async (req, res) => {
    try {
      console.log("paypal payment ---------------------------------------------------------");
      async function createOrder() {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: "10.00",
              },
            },
          ],
          application_context: {
            return_url: "http://localhost:3001/api/v1/auth/paypalsuccess", // redirect after approval
            cancel_url: "http://localhost:3001/api/v1/auth/paypalcancel", // redirect on cancel
          },
        });

        try {
          const order = await client.execute(request);
          const approvalLink = order.result.links.find((link) => link.rel === "approve").href;

          return {
            id: order.result.id,
            approvalLink,
          };
        } catch (err) {
          console.error("PayPal Create Order Error:", err);
          throw err;
        }
      }

      const resData = await createOrder();
      return apiResponse.OK({ res, message: "generate payment link", data: { id: resData.id, link: resData.approvalLink } });
    } catch (err) {
      console.log("error generating", err);
      return apiResponse.CATCH_ERROR({ res, message: message.something_went_wrong });
    }
  },

  // paypal demo with only link
  directPaymrntCaptureLink: async (req, res) => {
    try {
      async function generateAccessToken() {
        const response = await axios({
          url: process.env.PAYPAL_API + "/v1/oauth2/token",
          method: "post",
          data: "grant_type=client_credentials",
          auth: {
            username: process.env.CLIENT_ID,
            password: process.env.CLIENT_SECRET,
          },
        });

        return response.data.access_token;
      }

      const accessToken = await generateAccessToken();

      const url = `https://api-m.sandbox.paypal.com/v2/payments/authorizations/6DR965477U7140544/capture`;

      // Manually capture payment
      const captureResponse = await axios({
        url: url,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          phoneNo: 9898989898,
          orderId: "degfrg8vbnu81gb811thb15",
          paymentId: "brgbvvfb48jty",
          amount: 1,
        },
      });

      // var fetch = require("node-fetch");
      // fetch("https://api-m.sandbox.paypal.com/v2/payments/authorizations/6DR965477U7140544/capture", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: "Bearer A21_A.AAeMYAtAqEDt32STD8Yr1eIegfWDQ3IizjYHsmAT5mgwGFeNuBv4xxgRNj8CV5g15oMIjfBwYMrYZKviQIPoLV1lXDmZOw",
      //     "PayPal-Request-Id": "123e4567-e89b-12d3-a456-426655440010",
      //     Prefer: "return=representation",
      //   },
      //   body: JSON.stringify({}),
      // });

      return apiResponse.OK({ res, message: "generate payment link", data: { id: resData.id, link: resData.approvalLink } });
    } catch (err) {
      console.log("error generating", err);
      return apiResponse.CATCH_ERROR({ res, message: message.something_went_wrong });
    }
  },

  paypalsuccess: async (req, res) => {
    try {
      return res.status(200).json({ message: "order is success" });
    } catch (error) {
      console.log(error);
    }
  },

  paypalcancel: async (req, res) => {
    try {
      return res.status(200).json({ message: "order is cancle" });
    } catch (error) {
      console.log(error);
    }
  },

  // two park flow
  TwoParkcreateBooking: async (req, res) => {
    try {
      console.log("req.body", req.body);
      let { plateNumber, locationId, vehicleSize, name, nachname, strabe, email, PLZ, Stadt, telephone, fromTime, toTime, totalDuration, totalFare } = req.body;

      const formattedPlateNumber = plateNumber ? plateNumber.toUpperCase() : null;

      // Check for overlapping bookings
      const overlappingBooking = await DB.DAHBOOKEDPLATE.findOne({
        plateNumber: formattedPlateNumber,
        locationId,
        $or: [
          { fromTime: { $lt: toTime }, toTime: { $gt: fromTime } }, // Checks for time overlap
        ],
      });

      if (overlappingBooking) {
        return apiResponse.BAD_REQUEST({ res, message: "Für dieses Kennzeichen besteht bereits eine Buchung zu dieser Zei." }); //Booking already exists for this vehicle at this location during this time
      }

      let booking = new DB.DAHBOOKEDPLATE({
        plateNumber: formattedPlateNumber,
        locationId,
        vehicleSize,
        name,
        nachname,
        strabe,
        email,
        PLZ,
        Stadt,
        telephone,
        fromTime,
        toTime,
        totalDuration,
        totalFare,
        extended: false,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentId: null,
      });

      let bookingSave = await booking.save();
      let savedBooking = bookingSave.toObject();

      // generate onetime paypal payment link
      if (savedBooking) {
        const generatePaymentLink = await paypalService.paypalOneTimePayment({
          bookingId: savedBooking._id,
          plateNumber: savedBooking.plateNumber,
          telephone: savedBooking.telephone,
          email: savedBooking.email,
          totalFare: savedBooking.totalFare,
        });
        savedBooking = { ...savedBooking, paymentLink: generatePaymentLink ? generatePaymentLink : "" };
      }

      return apiResponse.OK({ res, message: "Die Buchung wurde erfolgreich durchgeführt", data: { savedBooking } }); //Booking created successfully
    } catch (error) {
      logger.error("Error in createBooking", error);
      return apiResponse.CATCH_ERROR(res, "Internal server error");
    }
  },

  // paypal webhook
  TwoParkwebhook: async (req, res) => {
    try {
      const event = req.body;
      console.log(event, "--------------------------------------- webhook req.body");

      if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
        console.log(event?.resource?.purchase_units[0], "--------------------------------------- CHECKOUT.ORDER.APPROVED event?.resource?.purchase_units[0]");

        let data = event?.resource?.purchase_units[0]?.custom_id;
        const orderId = event?.resource?.id;

        if (data) {
          data = JSON.parse(data);
          const url = `${process.env.PAYPAL_SANDBOX_URL}/v2/checkout/orders/${orderId}/capture`;

          await DB.PAYMENT.create({
            bookingId: data.bookingId,
            merchant: event?.resource?.purchase_units[0]?.payee ?? {},
            payer: event?.resource?.payer ?? {},
            amount: event?.resource?.purchase_units[0]?.amount ?? {},
            paypalOrderId: orderId,
            paymentStatus: PAYMENT_STATUS.PENDING, //  order created but payment capture pending
          });

          // const captureResponse = await paypalService.capturePayment({ orderId, bookingId:data.bookingId });
          const accessToken = await paypalService.generatePaypalAccessToken();

          // Manually capture payment
          const captureResponse = await axios({
            url: url,
            method: "post",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: {
              orderId: orderId,
              bookingId: data.bookingId,
            },
          });

          console.log(captureResponse.data, "--------------------------------------- captureResponse call from order app");
          // send response code to paypal
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        console.log(event?.resource, "------------------------------------------ PAYMENT.CAPTURE.COMPLETED");

        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          console.log(data, "------------------------------------------ PAYMENT.CAPTURE.COMPLETED data = JSON.parse(data);");

          // only update payment table as per orderId don't create new data
          const obj = {
            paypalOrderId: data.orderId,
            paymentStatus: PAYMENT_STATUS.PAID,
            seller_receivable_breakdown: event?.resource?.seller_receivable_breakdown ?? {},
            paypalTransactionId: event?.resource?.id ?? "",
          };
          const payment = await DB.PAYMENT.findOneAndUpdate({ bookingId: data.bookingId }, { $set: { ...obj } }, { new: true });
          await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: PAYMENT_STATUS.PAID, paymentId: payment._id } });
        }
      } else if (event.event_type === "CHECKOUT.ORDER.DECLINED" || event.event_type === "PAYMENT.ORDER.CANCELLED" || event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED" || event.event_type === "PAYMENT.CAPTURE.PENDING") {
        console.log(event.event_type, "payment failed -----------------------------");

        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          console.log(data, "------------------------------------------ PAYMENT.FAILED data = JSON.parse(data);");

          const obj = { paypalOrderId: data.orderId, paymentStatus: PAYMENT_STATUS.FAILED };
          const payment = await DB.PAYMENT.findOneAndUpdate({ bookingId: data.bookingId }, { $set: { ...obj } }, { new: true });
          await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: PAYMENT_STATUS.FAILED, paymentId: payment._id } });
        }
      } else {
        console.log(event.event_type, "un handle event -----------------------------");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error(error.response?.data || error.message || error);
      res.status(500).send("Something went wrong");
    }
  },
};
