import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addModule = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { courseId } = req.params;

  // check if course exists
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course didn't exists");
  }

  if (!course.instructor.equals(req?.user?._id)) {
    throw new ApiError(
      403,
      "You are not authorized to add module to this course"
    );
  }

  // create module
  const module = await Module.create({
    title,
    course: courseId,
  });

  const createdModule = await Module.findById(module?._id);

  if (!createdModule) {
    throw new ApiError(500, "Something went wrong while creating module");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdModule, "Module created successfully"));
});

export { addModule };
