import { Schema, model } from "mongoose";

const quizSchema = new Schema(
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
    timeLimit: {
      type: Number,
    },
  },
  { timestamps: true }
);

quizSchema.pre("deleteOne", async function (next) {
  await Question.deleteMany({ quiz: this._id });
  next();
});

export const Quiz = model("Quiz", quizSchema);
