import { Response } from "express";

export function sendError(response: Response, status: number, message: string) {
  return response.status(status).json({ message });
}
