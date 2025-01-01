import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "./logger.js";

const MAX_RETRIES = 3;
let retryCount = 0;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(`Upload failed, retrying (${retryCount} of ${MAX_RETRIES})`);
      setTimeout(
        () => uploadOnCloudinary(localFilePath),
        Math.pow(2, retryCount) * 1000
      ); // Exponential backoff
    } else {
      fs.unlinkSync(localFilePath);
      logger.error("Upload failed after maximum retries:", error);
    }

    return null;
  }
};

const deleteFromCloudinary = async (oldFilePublicId, resourceType = "auto") => {
  try {
    if (!oldFilePublicId) return null;

    const response = await cloudinary.uploader.destroy(oldFilePublicId, {
      resource_type: resourceType,
    });

    logger.info("Cloudinary Delete Response: ", response);
    return response;
  } catch (error) {
    logger.error("Error while deleting from cloudinary: ", error);
    return null;
  }
};

// Extract Public ID using Cloudinary Utility
const extractPublicId = (url) => {
  return cloudinary.utils.extract_public_id(url);
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicId };
