const message = require("../json/message.json");
const { PaymenModel, BookingModel } = require("../models");
const paypalService = require("../services/paypal.js");
const apiResponse = require("../utils/api.response");
const axios = require("axios");

const paypal = require("@paypal/checkout-server-sdk");

const environment = new paypal.core.SandboxEnvironment(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  // OPTION : 1 WITHOUT WEBHOOK (using rest api)=========================================================
  // call first order create ==> paypalDemoWithoutWebhook api
  // paypal give payment link click and payment
  // when success order paypal call return url(success) also send orderId as token in query
  // call paymentcapture api
  paypalDemoWithoutWebhook: async (req, res) => {
    try {
      const booking = await BookingModel.create({
        parkingName: "varachha",
        phoneNo: "8347337661",
        amount: 100,
        paymentStatus: "pending"
      })
      // generate onetime paypal payment link
      if (booking) {
        const generatePaymentLink = await paypalService.paypalOneTimePamentWithoutWebhook(booking);
        return res.status(200).json({ success: true, message: "order is success", data: generatePaymentLink });
      } else {
        return res.status(400).json({ success: false, message: "booking is not completed" });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  // capture payment manually ( orderid sent by paypal as token)
  // call this capturePayment endpoint from frontend when paypal redirect as success url in frontend
  capturePayment: async (req, res) => {
    try {
      // demo url ==> https://dev-parkschein-2park.netlify.app/verify-payment?680c85d17acd092621a76f95&token=4ML73926KP0936411&PayerID=MGGDHYZ9S9BMA
      const orderId = "4ML73926KP0936411";    // success order
      // const orderId = req.query.token;  // get order id as token which is directly set in query by paypal
      const bookingId = req.query.bookingId
      if (orderId) {
        const url = `${PAYPAL_URL}/v2/checkout/orders/${orderId}/capture`;
        const accessToken = await paypalService.generatePaypalAccessToken();
        const captureResponse = await axios({
          url: url,
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: {
            orderId: orderId,
            // bookingId: data.bookingId,
          },
        });
        console.log(captureResponse, "-------------------------------- captureResponse");

        if (captureResponse) {
          const status = captureResponse?.data?.status;
          if (status == "COMPLETED") {
            const [payment, booking] = await Promise.all([
              PaymenModel.create({
                paypalOrderId: orderId,
                payer: req.query.PayerID,
                paypalTransactionId: captureResponse.id,
                bookingId: bookingId,
                paymentStatus: "paid",
              }),
              BookingModel.findOneAndUpdate({ _id: bookingId }, { paymentStatus: 'paid' })
            ])
            return apiResponse.OK({ res, message: "payment capture successfully", data: { payment: payment, booking: booking } }); //payment capture successfully          }
          } else {
            const [payment, booking] = await Promise.all([
              PaymenModel.create({
                paypalOrderId: orderId,
                payer: req.query.PayerID,
                paypalTransactionId: captureResponse.id,
                bookingId: req.query.bookingId,
                paymentStatus: captureResponse.status,  // pending or failed something
              }),
              BookingModel.findOneAndUpdate({ _id: bookingId }, { paymentStatus: captureResponse.status })
            ])
            return apiResponse.OK({ res, message: "payment failed", data: { payment: payment, booking: booking } }); //payment capture successfully          }
          }
        }
      } else {
        console.log("orderId not found");
        return apiResponse.BAD_REQUEST({ res, message: "orderId not found." }); // orderId not found
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },



  // OPTION : 2 WITH WEBHOOK (using rest api)============================================================
  paypalDemoWithWebhook: async (req, res) => {
    try {
      const booking = await BookingModel.create({
        parkingName: "varachha",
        phoneNo: "8347337661",
        amount: 100,
        paymentStatus: "pending"
      })
      // generate onetime paypal payment link
      if (booking) {
        const generatePaymentLink = await paypalService.paypalOneTimePaymentWithWebhook(booking);
        return res.status(200).json({ success: true, message: "order is success", data: generatePaymentLink });
      } else {
        return res.status(400).json({ success: false, message: "booking is not completed" });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

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

          await Promise.all([
            // set in db as payment pending but order approved
            PaymenModel.create({
              paypalOrderId: orderId,
              payer: event?.resource?.payer ?? {},
              merchant: event?.resource?.purchase_units[0]?.payee ?? {},
              bookingId: data.bookingId,
              amount: data.amount,
              paymentStatus: "pending",  // pending or failed something
            }),
            // capture payment manually from user acc
            paypalService.capturePayment({ orderId, bookingId: data.bookingId })
          ])
          res.status(200).send("OK");
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);

          const payment = await PaymenModel.findOneAndUpdate({ bookingId: data.bookingId }, {
            $set: {
              seller_receivable_breakdown: event?.resource?.seller_receivable_breakdown ?? {}, // set saller payment brek down
              paymentStatus: "paid",
              paypalTransactionId: event?.resource?.id ?? "",
            }
          })

          await BookingModel.findOneAndUpdate({ bookingId: data.bookingId }, {
            $set: {
              paymentStatus: "paid",
              paymentId: payment._id
            }
          })

          res.status(200).send("OK");
        }
      } else if (event.event_type === "CHECKOUT.ORDER.DECLINED" || event.event_type === "PAYMENT.ORDER.CANCELLED" || event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED" || event.event_type === "PAYMENT.CAPTURE.PENDING") {
        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);

          const payment = await PaymenModel.findOneAndUpdate({ bookingId: data.bookingId }, {
            $set: {
              paymentStatus: "failed",
              paypalTransactionId: event?.resource?.id ?? "",
            }
          })

          await BookingModel.findOneAndUpdate({ bookingId: data.bookingId }, {
            $set: {
              paymentStatus: "failed",
              paymentId: payment._id
            }
          })

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

  // check payment is completed from client
  checkpayment: async (req, res) => {
    try {
      const bookingId = req.query.bookingId
      const booking = await BookingModel.findById(bookingId)
      return res.status(200).json({ success: true, message: "booking data get successfully", paymentStatus: booking.paymentStatus });
    } catch (error) {
      console.log("error generating", err);
      return apiResponse.CATCH_ERROR({ res, message: message.something_went_wrong });
    }
  },


  // OPTION : 3 WITH WEBHOOK (using sdk) ================================================================
  // paypal demo using sdk  ( optional )
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
