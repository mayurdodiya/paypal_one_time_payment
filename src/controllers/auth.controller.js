// const paypal = require("../services/paypal");
const message = require("../json/message.json");
const { PaymenModel } = require("../models");
const apiResponse = require("../utils/api.response");
const axios = require("axios");
const fs = require("fs");

// file: createPayPalPayment.js
const paypal = require("@paypal/checkout-server-sdk");

// 1. Setup PayPal Environment (Sandbox or Live)
const environment = new paypal.core.SandboxEnvironment(
  process.env.CLIENT_ID, // Replace with your actual PayPal Client ID
  process.env.CLIENT_SECRET // Replace with your actual PayPal Secret
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  webhook: async (req, res) => {
    try {
      const event = req.body;
      let capturePayment;

      if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
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
        const captureResponse = await axios.post(
          url,
          {
            body: {
              phoneNo: 9898989898,
              orderId: "degfrg8vbnu81gb811thb15",
              paymentId: "brgbvvfb48jty",
              amount: 1,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        capturePayment = captureResponse.data;
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        console.log(event.event_type, "------------------------------------------ PAYMENT.CAPTURE.COMPLETED");

        const obj = {
          orderId: event.id,
          phoneNo: "igeg8gege9e8",
          paymentId: event.id,
          amount: 10,
        };
        await PaymenModel.create(obj);
      } else {
        console.log("unknown event -----------------------------");
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error(error.response?.data || error.message || error);
      res.status(500).send("Something went wrong");
    }
  },

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
            amount: {
              currency_code: "USD",
              value: "12",
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
};
