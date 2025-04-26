const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
    parkingName: {
      type: String,
    },
    phoneNo: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      default: "pending"
    },
    paymentId: {
      type: String,
      default: null
    },
  },
  { timestamps: true, versionKey: false }
);

const Booking = mongoose.model("booking", bookingSchema);
module.exports = Booking;
