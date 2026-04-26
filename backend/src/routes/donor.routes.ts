import { Router } from "express";
import { donorController } from "../controllers/donor.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validateRequest } from "../middlewares/validationMiddleware";
import {
  createDonorSchema,
  updateDonorSchema,
  donorIdParamSchema,
} from "../types/donor.types";

const router = Router();

router.get("/", asyncHandler(donorController.getAll));
router.get(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  asyncHandler(donorController.getById)
);
router.post(
  "/",
  validateRequest(createDonorSchema, "body"),
  asyncHandler(donorController.create)
);
router.put(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  validateRequest(updateDonorSchema, "body"),
  asyncHandler(donorController.update)
);
router.delete(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  asyncHandler(donorController.remove)
);

export default router;
