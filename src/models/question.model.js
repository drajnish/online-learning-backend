import { Schema, model } from "mongoose";

const questionSchema = new Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: [
      {
        text: String,
        isCorrect: Boolean,
        default: false,
      },
    ],
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    // module: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Module",
    //   required: true,
    // },
    questionType: {
      type: String,
      enum: ["MCQ", "TRUE/FALSE"],
    },
  },
  { timestamps: true }
);

export const Question = model("Question", questionSchema);
