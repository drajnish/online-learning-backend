import { Schema, model } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Categories",
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advance"],
    },
    duration: {
      type: String,
    },
    language: {
      type: String,
    },
    whatYouWillLearn: {
      type: String,
    },
    requirements: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Course = model("Course", courseSchema);
