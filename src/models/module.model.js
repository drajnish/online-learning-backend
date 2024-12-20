import { Schema, model } from "mongoose";

const moduleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Module = model("Module", moduleSchema);
