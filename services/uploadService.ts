import { http } from "@/lib";

/**
 * Upload Service — images (JPEG, PNG, WebP, GIF, SVG) and MP4 videos.
 * Both use POST /upload/image with multipart field name "file".
 */

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await http.post("/upload/image", formData, {
    // Override the axios instance default (application/json) so the browser
    // sets multipart/form-data with the correct boundary.
    headers: { "Content-Type": undefined },
  });

  return response.data.data.url;
};
