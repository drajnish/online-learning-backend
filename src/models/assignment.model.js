import { Schema, model } from "mongoose";

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
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
