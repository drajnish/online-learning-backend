import { Schema, model } from "mongoose";

const categoriesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Categories = model("Categories", categoriesSchema);
