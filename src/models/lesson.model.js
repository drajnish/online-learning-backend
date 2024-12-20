import { Schema, model } from "mongoose";

const lessonSchema = new Schema(
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
    content: {
      type: String,
    },
    videoFile: {
      type: String,
    },
    description: {
      type: String,
    },
    resources: {
      type: [{ String }],
    },
  },
  { timestamps: true }
);

export const Lesson = model("Lesson", lessonSchema);
