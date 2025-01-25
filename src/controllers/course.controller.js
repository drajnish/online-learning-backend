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
  // TODO: delete all other collections data related to this course such as lessons, quizzes, etc. using Transaction

  const deleteCourse = await Course.findById(courseId);

  if (!deleteCourse) {
    throw new ApiError(500, "Something went wrong while deleting the course");
  }

  // it removes the course and trigger the pre remove hook to delete all the related data
  await deleteCourse.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Course deleted successfully"));
});

const togglePublishCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // check if the course exists
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // check if the course belongs to the instructor of the course
  if (!course?.instructor.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to publish this course");
  }

  const previousPublishStatus = course.isPublished;

  // publish the course
  const publishedCourse = await Course.findByIdAndUpdate(
    courseId,
    {
      $set: {
        isPublished: !previousPublishStatus,
      },
    },
    { new: true }
  );

  if (!publishedCourse) {
    throw new ApiError(
      500,
      "Something went wrong while changing publish status of the course"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        publishedCourse,
        "Course publish status changed successfully"
      )
    );
});

const getAllCourses = asyncHandler(async (req, res) => {
  const { query } = req.query; // Extract search parameters from query
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
  const skip = (page - 1) * limit; // Calculate skip value

  // Build the match query dynamically
  const matchQuery = { isPublished: true }; // Default to only published courses

  if (query) {
    matchQuery.title = { $regex: query, $options: "i" }; // Case-insensitive search by title
    // matchQuery.category = { $regex: query, $options: "i" }; // Case-insensitive search by category
  }

  // Count total documents matching the query
  const totalCourses = await Course.countDocuments(matchQuery);

  // Fetch paginated courses with sorting
  const courses = await Course.aggregate([
    {
      $match: matchQuery, // Filter courses based on query
    },
    {
      $sort: { createdAt: -1 }, // Sort by createdAt in descending order
    },
    {
      $skip: skip, // Skip documents for pagination
    },
    {
      $limit: limit, // limit documents per page
    },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructor",
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        price: 1,
        level: 1,
        // instructor: 1,
        // category: 1,
        rating: 1,
        language: 1,
      },
    },
  ]);

  const totalPages = Math.ceil(totalCourses / limit); // Calculate total pages

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        courses: courses,
        pagination: { totalCourses, totalPages, currentPage: page, limit },
      },
      "Courses fetched successfully"
    )
  );
});

export {
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  getAllCourses,
};
