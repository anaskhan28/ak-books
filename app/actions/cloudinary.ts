"use server";

import { v2 as cloudinary } from "cloudinary";

// Configuration is automatically picked up from CLOUDINARY_URL in .env
cloudinary.config({
  secure: true,
});

export async function uploadImage(base64Data: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "templates", // As requested by user
      resource_type: "auto",
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: "Failed to upload image to Cloudinary",
    };
  }
}
