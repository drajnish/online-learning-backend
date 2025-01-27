import mongoose, { isValidObjectId } from "mongoose";
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
    throw new ApiError(404, "Course not found");
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

const updateModule = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { courseId, moduleId } = req.params;

  // check if module exists
  const module = await Module.findById(moduleId);

  if (!module) {
    throw new ApiError(404, "Module not found");
  }

  // check if module belongs to same course
  if (!module?.course.equals(courseId)) {
    throw new ApiError(403, "Module doesn't belongs to this course");
  }

  // check if instructor belongs to same course
  const course = await Course.findById(courseId);

  if (!course.instructor.equals(req?.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this module");
  }

  // update module
  const updatedModule = await Module.findByIdAndUpdate(
    moduleId,
    {
      title,
    },
    { new: true }
  );

  if (!updatedModule) {
    throw new ApiError(500, "Something went wrong while updating module");
  }

  return res.status(200).json(200, updateModule, "Module updated successfully");
});

// delete module
const deleteModule = asyncHandler(async (req, res) => {
  const { moduleId } = req?.params;

  // check if module exists
  const module = await Module.findById(moduleId);

  if (!module) {
    throw new ApiError(404, "Module not found");
  }

  // check if instructor belongs to this course
  const course = await Course.findById(module.course);

  if (!course.instructor.equals(req?.user?._id)) {
    throw new ApiError(403, "You are not authorized to delete this module");
  }

  // Delete the module
  await module.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Module deleted successfully"));
});

const getAllModules = asyncHandler(async (req, res) => {
  const { courseId } = req.paramas;

  // fetch course detail
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // fetch all modules belongs to the course
  const modules = await Module.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(isValidObjectId(courseId)),
      },
    },
    {
      $lookup: {
        from: "lessons",
        localField: "_id",
        foreignField: "module",
        as: "lessons",
      },
    },
    {
      $sort: { createdAt: 1 },
    },
  ]);

  if (!modules) {
    throw new ApiError(404, "Modules not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, modules, "Modules fetched successfully"));
});

export { addModule, updateModule, deleteModule, getAllModules };
