import { Request, Response } from "express";

import { generatePhotoSuggestions, OpenAIConfigurationError } from "../services/openai.service.js";
import { sendError } from "../utils/http.js";

export async function suggestPhotoMetadata(request: Request, response: Response) {
  if (!request.file) {
    return sendError(response, 400, "Image is required");
  }

  if (!request.file.mimetype.startsWith("image/")) {
    return sendError(response, 400, "Only image files can be analyzed");
  }

  try {
    const item = await generatePhotoSuggestions(request.file.buffer, request.file.mimetype);
    return response.json({ item });
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      return sendError(response, 503, "AI assistant is not configured");
    }

    console.error("Photo AI suggestions failed", error);
    return sendError(response, 502, "AI suggestions could not be generated");
  }
}
