import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import syncRoutes from "./routes/sync.routes";


const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json());


app.use("/api", routes);
app.use("/api/sync", syncRoutes);

app.use(errorHandler);

export default app;
