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
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.statusCode === 404 ? "NOT_FOUND" : "VALIDATION_ERROR",
        details: err.details || null
      }
    });
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
      success: false,
      message: "خطأ في التحقق من البيانات",
      error: {
        code: "VALIDATION_ERROR",
        details: fieldErrors
      }
    });
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: "صيغة JSON غير صحيحة",
      error: {
        code: "INVALID_JSON",
        details: null
      }
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "خطأ في السيرفر",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      details: null
    }
  });
};
