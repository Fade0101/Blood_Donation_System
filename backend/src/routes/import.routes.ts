import { Router } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";
import { catchAsync } from "../utils/catchAsync";

// Shared multer configuration for all import endpoints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

const router = Router();

// Blood Bank Import - for active campaign donor registration
router.post(
  "/blood-bank",
  upload.single("file"),
  catchAsync(importController.importBloodBank)
);

// Legacy Import - for old system migration
router.post(
  "/legacy",
  upload.single("file"),
  catchAsync(importController.importLegacy)
);

export default router;
