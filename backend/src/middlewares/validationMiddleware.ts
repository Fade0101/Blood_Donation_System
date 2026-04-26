import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateRequest =
  (schema: ZodSchema, source: "body" | "params" | "query" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === "body" ? req.body : source === "params" ? req.params : req.query;
      const validated = schema.parse(data);

      if (source === "body") {
        req.body = validated;
      } else if (source === "params") {
        req.params = validated as any;
      } else {
        req.query = validated as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
