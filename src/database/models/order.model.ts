import { Schema, model, models } from "mongoose";

const orderSchema = new Schema(
  {
    stripeId: {
      type: String,
      required: true,
      unique: true,
    },
    totalAmount: {
      type: String,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Order = models.Order || model("Order", orderSchema);
