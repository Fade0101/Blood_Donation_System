import { Router } from "express";
import donorRoutes from "./donor.routes";
import campaignRoutes from "./campaign.routes";
import importRoutes from "./import.routes";

const router = Router();

router.use("/donors", donorRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/imports", importRoutes);

export default router;
