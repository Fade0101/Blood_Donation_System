import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller";
import { catchAsync } from "../utils/catchAsync";
import { validateRequest } from "../middlewares/validationMiddleware";
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdParamSchema,
  campaignIdParamSchemaByName,
  registerDonorSchema,
} from "../types/campaign.types";

const router = Router();

router.get("/", catchAsync(campaignController.getAll));
router.post(
  "/",
  validateRequest(createCampaignSchema, "body"),
  catchAsync(campaignController.create)
);
router.get(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  catchAsync(campaignController.getById)
);
router.put(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  validateRequest(updateCampaignSchema, "body"),
  catchAsync(campaignController.update)
);
router.delete(
  "/:id",
  validateRequest(campaignIdParamSchema, "params"),
  catchAsync(campaignController.remove)
);

router.post(
  "/:campaignId/register",
  validateRequest(campaignIdParamSchemaByName, "params"),
  validateRequest(registerDonorSchema, "body"),
  catchAsync(campaignController.registerDonor)
);
router.delete(
  "/:campaignId/donors/:nationalId",
  catchAsync(campaignController.removeDonor)
);
router.get(
  "/:campaignId/export",
  catchAsync(campaignController.exportDonorsCsv)
);
router.get(
  "/:campaignId/donors",
  catchAsync(campaignController.getDonorsforCampaign)
);

export default router;