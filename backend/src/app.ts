import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import campaignRoutes from "./routes/campaign.routes";
import syncRoutes from "./routes/sync.routes";


const app = express();

app.use(cors());
app.use(express.json());


app.use("/api", routes);
app.use('/api/sync', syncRoutes);

app.use(errorHandler);

export default app;
