import { Schema, model, models } from "mongoose";

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    startDateTime: {
      type: Date,
      default: Date.now,
    },
    endDateTime: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Event = models.Event || model("Event", eventSchema);
