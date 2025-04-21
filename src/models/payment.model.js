const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
    },
    phoneNo: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
