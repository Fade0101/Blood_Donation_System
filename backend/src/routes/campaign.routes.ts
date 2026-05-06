import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validateRequest } from "../middlewares/validationMiddleware";
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdParamSchema,
  campaignIdParamSchemaByName,
  registerDonorSchema,
} from "../types/campaign.types";

const router = Router();

router.get("/", asyncHandler(campaignController.getAll));
router.post(
  "/",
  validateRequest(createCampaignSchema, "body"),
  asyncHandler(campaignController.create)
);
router.get(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  asyncHandler(campaignController.getById)
);
router.put(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  validateRequest(updateCampaignSchema, "body"),
  asyncHandler(campaignController.update)
);
router.delete(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  asyncHandler(campaignController.remove)
);

router.post(
  "/:campaignId/register",
  validateRequest(campaignIdParamSchemaByName, "params"),
  validateRequest(registerDonorSchema, "body"),
  asyncHandler(campaignController.registerDonor)
);
router.get(
  "/:campaignId/export",
  asyncHandler(campaignController.exportDonorsCsv)
);
router.get(
  "/:campaignId/donors",
  asyncHandler(campaignController.getDonorsforCampaign)
);

export default router;