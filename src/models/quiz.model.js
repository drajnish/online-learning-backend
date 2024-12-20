import { Schema, model } from "mongoose";

const quizSchema = new Schema(
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
    timeLimit: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Quiz = model("Quiz", quizSchema);
