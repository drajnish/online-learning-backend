import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRolesEnum } from "../constants/http.constants.js";
import { ApiError } from "../utils/ApiError.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Categories } from "../models/categories.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

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

// Add thumbnail to a course
const updateCourseThumbnail = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const thumbnailLocalPath = req?.file?.path;

  if (!isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // check if the course exists
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // check if the course belongs to the instructor
  if (!course?.instructor.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this course");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(
      500,
      "Something went wrong while uploading the thumbnail"
    );
  }

  const oldThumbnail = course?.thumbnail?.split("/")?.pop()?.split(".")[0];

  //   Update the course thumbnail
  const updatedCourseThumbnail = await Course.findByIdAndUpdate(
    courseId,
    {
      $set: {
        thumbnail: thumbnail?.url,
      },
    },
    {
      new: true,
    }
  ).select("thumbnail");

  // Delete the previous thumbnail from cloudinary
  if (oldThumbnail) {
    await deleteFromCloudinary(oldThumbnail, "image");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCourseThumbnail,
        "Thumbnail updated successfully."
      )
    );
});

// Delete a course
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
  // TODO: delete all other collections data related to this course such as lessons, quizzes, etc. using Transaction also look for indexing fields

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

// Publish or Unpublish a course
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

// Get all courses
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

// Get a course by ID
const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // check if the course exists
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Fetch the course with instructor and category details
  const fetchedCourse = await Course.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(String(courseId)) },
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
      $lookup: {
        from: "modules",
        localField: "_id",
        foreignField: "course",
        as: "modules",
        pipeline: [
          {
            $lookup: {
              from: "lessons",
              localField: "_id",
              foreignField: "module",
              as: "lessons",
            },
          },
          {
            $lookup: {
              from: "quizzes",
              localField: "_id",
              foreignField: "module",
              as: "quizzes",
            },
          },
          {
            $lookup: {
              from: "assignments",
              localField: "_id",
              foreignField: "module",
              as: "assignments",
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "course",
        as: "reviews",
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        price: 1,
        level: 1,
        duration: 1,
        language: 1,
        requirements: 1,
        rating: 1,
        language: 1,
        isPublished: 1,
        instructor: { $arrayElemAt: ["$instructor", 0] },
        category: { $arrayElemAt: ["$category", 0] },
        modules: 1,
      },
    },
  ]);

  if (!fetchedCourse) {
    throw new ApiError(500, "Something went wrong while fetching the course");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, fetchedCourse[0], "Course fetched successfully")
    );
});

export {
  createCourse,
  updateCourse,
  updateCourseThumbnail,
  deleteCourse,
  togglePublishCourse,
  getAllCourses,
  getCourseById,
};
