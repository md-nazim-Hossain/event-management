import { Schema, model, models } from "mongoose";

const categoryUser = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Category = models.Category || model("Category", categoryUser);
