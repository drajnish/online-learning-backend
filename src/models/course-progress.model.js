import { Schema, model } from "mongoose";

const coursePrgressSchema = new Schema(
  {
    completedModules: [
      {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    lastAccessedLesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
    },
  },
  { timestamps: true }
);

export const CourseProgress = model("CourseProgress", coursePrgressSchema);
