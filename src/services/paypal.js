const axios = require("axios");

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
  paypalOneTimePaymentWithWebhook: async (data) => {
    try {

      const accessToken = await generatePaypalAccessToken();

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
                  value: data.amount,
                },
              },
            ],
            amount: {
              currency_code: "EUR",
              value: data.amount,
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: data.amount,
                },
              },
            },
            custom_id: JSON.stringify({
              bookingId: data._id,
              amount: data.amount,
            }),
          },
        ],
        application_context: {
          cancel_url: process.env.CANCEL_URL, // redirect on cancel
          return_url: `${process.env.VERIFIYING_URL}?bookingId=${data._id}`, // redirect after approval
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "your company name",
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

      return approvedLink;
    } catch (error) {
      console.log("Error in paypalOneTimePayment", error);
      throw error;
    }
  },

  // capture payment manually
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


  // paypal one time payment paypal Without Webhook
  paypalOneTimePamentWithoutWebhook: async (data) => {
    try {

      const accessToken = await generatePaypalAccessToken();

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
                  value: data.amount,
                },
              },
            ],
            amount: {
              currency_code: "EUR",
              value: data.amount,
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: data.amount,
                },
              },
            },
            custom_id: JSON.stringify({
              bookingId: data._id,
              phoneNo: data.phoneNo,
            }),
          },
        ],
        application_context: {
          cancel_url: process.env.CANCEL_URL, // redirect on cancel
          return_url: `${process.env.SUCCESS_URL}?bookingId=${data._id}`, // redirect after approval(paypal send orderId and as token and payerId)
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "your company name",
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

      return approvedLink;
    } catch (error) {
      console.log("Error in paypalOneTimePayment", error);
      throw error;
    }
  },
};
