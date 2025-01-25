import { Schema, model } from "mongoose";

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    totalMarks: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Assignment = model("Assignment", assignmentSchema);
