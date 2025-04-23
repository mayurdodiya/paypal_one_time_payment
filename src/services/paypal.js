const axios = require("axios");
const fs = require("fs");
const { logger } = require("../utils/logger");
// const paypal = require("@paypal/checkout-server-sdk");      // deprecated
const paypal = require("@paypal/paypal-server-sdk");

// generate paypal access token ( for current file )
async function generatePaypalAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_SANDBOX_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET,
    },
  });
  return response.data.access_token;
}

module.exports = {
  // generate paypal access token
  generatePaypalAccessToken: async () => {
    const response = await axios({
      url: process.env.PAYPAL_SANDBOX_URL + "/v1/oauth2/token",
      method: "post",
      data: "grant_type=client_credentials",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
    });
    return response.data.access_token;
  },

  // paypal one time payment
  paypalOneTimePayment: async ({ bookingId, plateNumber, telephone, email, totalFare }) => {
    try {
      console.log(bookingId, plateNumber, telephone, email, totalFare, "------------------------------------------ paypalDemoAsOralense");

      const accessToken = await generatePaypalAccessToken();
      console.log(accessToken, "------------------------------------------ paypalDemoAsOralense/accessToken");

      const url = `${process.env.PAYPAL_SANDBOX_URL}/v2/checkout/orders`;
      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: [
              {
                name: "Parking Rent",
                description: "Parking booking for rent",
                quantity: 1,
                unit_amount: {
                  currency_code: "EUR",
                  value: totalFare,
                },
              },
            ],
            amount: {
              currency_code: "EUR",
              value: totalFare,
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: totalFare,
                },
              },
            },
            custom_id: JSON.stringify({
              bookingId: bookingId,
              plateNumber: plateNumber,
              telephone: telephone,
              email: email,
              totalFare: totalFare,
            }),
          },
        ],
        application_context: {
          cancel_url: process.env.CANCEL_URL, // redirect on cancel
          return_url: `${process.env.VERIFIYING_URL}?${bookingId}`, // redirect after approval
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "2Park GmbH",
          // landing_page: "LOGIN",  //  check in docs "LOGIN" (default) or "BILLING" (shows credit card form)
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const approvedLink = response?.data?.links.find((link) => link.rel === "approve").href;
      console.log(response?.data?.links, "------------------------------------------ paypalDemoAsOralense/response?.data?.links");

      return approvedLink;
    } catch (error) {
      logger.error("Error in paypalOneTimePayment", error);
      throw error;
    }
  },

  capturePayment: async (data) => {
    const url = `${process.env.PAYPAL_SANDBOX_URL}/v2/checkout/orders/${data.orderId}/capture`;
    const accessToken = await generatePaypalAccessToken();
    const captureResponse = await axios({
      url: url,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        orderId: data.orderId,
        bookingId: data.bookingId,
      },
    });
    return captureResponse;
  },
};
