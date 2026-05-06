import { Router } from "express";
import { donorController } from "../controllers/donor.controller";
import { catchAsync } from "../utils/catchAsync";
import { validateRequest } from "../middlewares/validationMiddleware";
import {
  createDonorSchema,
  updateDonorSchema,
  donorIdParamSchema,
} from "../types/donor.types";

const router = Router();

router.get("/", catchAsync(donorController.getAll));
router.get("/search", catchAsync(donorController.search));
router.get(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  catchAsync(donorController.getById)
);
router.post(
  "/",
  validateRequest(createDonorSchema, "body"),
  catchAsync(donorController.create)
);
router.put(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  validateRequest(updateDonorSchema, "body"),
  catchAsync(donorController.update)
);
router.delete(
  "/:id",
  validateRequest(donorIdParamSchema, "params"),
  catchAsync(donorController.remove)
);

export default router;
