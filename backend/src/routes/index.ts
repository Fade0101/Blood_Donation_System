import { Router } from "express";
import donorRoutes from "./donor.routes";
import campaignRoutes from "./campaign.routes";

const router = Router();

router.use("/donors", donorRoutes);
router.use("/campaigns", campaignRoutes); 

export default router;
