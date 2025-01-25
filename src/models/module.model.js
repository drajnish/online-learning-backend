import { Schema, model } from "mongoose";
import { Lesson } from "./lesson.model.js";
import { Quiz } from "./quiz.model.js";
import { Assignment } from "./assignment.model.js";

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
  },
  { timestamps: true }
);

moduleSchema.pre("deleteOne", async function (next) {
  await Lesson.deleteMany({ module: this._id });
  await Quiz.deleteMany({ module: this._id });
  await Assignment.deleteMany({ module: this._id });
  next();
});

export const Module = model("Module", moduleSchema);
