import { Schema, model } from "mongoose";
import { Module } from "./module.model.js";
import { Review } from "./review.model.js";

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
      type: String,
      // type: Schema.Types.ObjectId,
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

courseSchema.pre("deleteOne", async function (next) {
  await Module.deleteMany({ course: this._id });
  await Review.deleteMany({ course: this._id });
  next();
});

export const Course = model("Course", courseSchema);
