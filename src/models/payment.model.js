const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    bookingId: {
      type: String,
    },
    paypalOrderId: {
      type: String,
    },
    paypalTransactionId: {
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      default: "pending"
    },
    payer: {
      type: Object,
      default: {},
    },
    merchant: {
      type: Object,
      default: {},
    },
    seller_receivable_breakdown: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true, versionKey: false }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
