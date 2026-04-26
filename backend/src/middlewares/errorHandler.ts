import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    const response: Record<string, any> = { error: err.message };
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = (err as ZodError<unknown>).issues.reduce(
      (acc: Record<string, string>, issue: ZodIssue) => {
        const path = issue.path.join(".");
        acc[path] = issue.message;
        return acc;
      },
      {} as Record<string, string>
    );
    res.status(400).json({
      error: "Validation failed",
      details: fieldErrors,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
