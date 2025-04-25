// const paypal = require("../services/paypal");
const message = require("../json/message.json");
const { PaymenModel } = require("../models");
const paypalService = require("../services/paypal.js");
const apiResponse = require("../utils/api.response");
const axios = require("axios");
const fs = require("fs");

const paypal = require("@paypal/checkout-server-sdk");

// 1. Setup PayPal Environment (Sandbox or Live)
const environment = new paypal.core.SandboxEnvironment(
  process.env.CLIENT_ID, // Replace with your actual PayPal Client ID
  process.env.CLIENT_SECRET // Replace with your actual PayPal Secret
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  // final create waiting loder in client side till payment_status not paid ( call api every 5 sec to check database status )
  webhook: async (req, res) => {
    try {
      const event = req.body;

      if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
        // get meta data from webhook
        let data = event?.resource?.purchase_units[0]?.custom_id;
        const orderId = event?.resource?.id;

        if (data) {
          data = JSON.parse(data);

          // set in db as payment pending but order approved
          // await DB.PAYMENT.create({
          //   bookingId: data.bookingId,
          //   merchant: event?.resource?.purchase_units[0]?.payee ?? {},
          //   payer: event?.resource?.payer ?? {},
          //   amount: event?.resource?.purchase_units[0]?.amount ?? {},
          //   paypalOrderId: orderId,
          //   paymentStatus: PAYMENT_STATUS.PENDING, //  order created but payment capture pending
          // });

          // capture payment manually from user acc
          await paypalService.capturePayment({ orderId, phoneNo: data.phoneNo });
          res.status(200).send("OK");
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          const obj = {
            amount: 12,
            orderId: data.orderId,
            phoneNo: data?.phoneNo,
            paymentStatus: "paid",
            seller_receivable_breakdown: event?.resource?.seller_receivable_breakdown ?? {}, // set saller payment brek down
            paypalTransactionId: event?.resource?.id ?? "",
          };

          // save booking payment data in db
          // const payment = await DB.PAYMENT.findOneAndUpdate({ bookingId: data.bookingId }, { $set: { ...obj } }, { new: true });
          // await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: PAYMENT_STATUS.PAID, paymentId: payment._id } });
          res.status(200).send("OK");
        }
      } else if (event.event_type === "CHECKOUT.ORDER.DECLINED" || event.event_type === "PAYMENT.ORDER.CANCELLED" || event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED" || event.event_type === "PAYMENT.CAPTURE.PENDING") {
        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          const obj = {
            phoneNo: data?.phoneNo,
            paymentStatus: "failed",
            paypalTransactionId: event?.resource?.id ?? "",
          };

          // save booking payment data in db
          // const payment = await DB.PAYMENT.findOneAndUpdate({ orderId: data.orderId }, { $set: { ...obj } }, { new: true });
          // await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: "failed", paymentId: payment._id } });
          res.status(200).send("OK");
        }
      } else {
        console.log("Unhandled Event :", event.event_type);
        res.status(200).send("OK");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error(error.response?.data || error.message || error);
      res.status(500).send("Something went wrong");
    }
  },

  // final flow
  paypalDemoAsOralense: async (req, res) => {
    try {
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
              amount: 12,
            }),
          },
        ],
        application_context: {
          cancel_url: "http://localhost:3001/api/v1/auth/paypalcancel", // redirect on cancel
          return_url: "http://localhost:3001/api/v1/auth/paypalsuccess", // redirect after approval
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "your company name",
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

  // paypal demo as github lac ( optional )
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

  // paypal demo with only link  ( optional )
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

  // success url
  paypalsuccess: async (req, res) => {
    try {
      return res.status(200).json({ message: "order is success" });
    } catch (error) {
      console.log(error);
    }
  },

  // cancle url
  paypalcancel: async (req, res) => {
    try {
      return res.status(200).json({ message: "order is cancle" });
    } catch (error) {
      console.log(error);
    }
  },

};
