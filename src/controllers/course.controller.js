import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRolesEnum } from "../constants/http.constants.js";
import { ApiError } from "../utils/ApiError.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Categories } from "../models/categories.model.js";
import { isValidObjectId } from "mongoose";

// Create a new course
const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    level,
    duration,
    language,
    requirements,
  } = req.body;

  //   check if the instructor exists
  const instructor = await User.findOne({
    _id: req.user?._id,
    role: UserRolesEnum.INSTRUCTOR,
  });

  if (!instructor) {
    throw new ApiError(403, "Only instructors can create courses");
  }

  //   check if the category exists
  //   const categoryExists = await Categories.findById(category);
  //   if (!categoryExists || !isValidObjectId(categoryExists._id)) {
  //     throw new ApiError(404, "Category not found or invalid");
  //   }

  // create the course
  const course = await Course.create({
    title,
    description,
    instructor: instructor?._id,
    price,
    category,
    level,
    duration,
    language,
    requirements,
  });

  const createdCourse = await Course.findById(course._id);

  if (!createdCourse) {
    throw new ApiError(500, "Something went wrong while creating the course");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, course, "Course created successfully."));
});

// Update a course
const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const {
    title,
    description,
    price,
    category,
    level,
    duration,
    language,
    requirements,
  } = req.body;

  // check if the course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // check if the course belongs to the instructor
  if (!course?.instructor.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this course");
  }

  //   Update the course
  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    {
      title,
      description,
      price,
      category,
      level,
      duration,
      language,
      requirements,
    },
    {
      new: true,
    }
  );

  if (!updatedCourse) {
    throw new ApiError(500, "Something went wrong while updating the course");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

const deleteCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // check if the course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // check if the course belongs to the instructor
  if (!course?.instructor.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to delete this course");
  }

  // delete the course
  // TODO: delete all other collections data related to this course such as lessons, quizzes, etc.
  await Course.findByIdAndDelete(courseId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Course deleted successfully"));
});

export { createCourse, updateCourse, deleteCourse };
