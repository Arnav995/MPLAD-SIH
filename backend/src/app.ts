import cors from "cors";
import express from "express";

import duplicateRoutes from "./routes/duplicate.routes.js";
import projectRoutes from "./routes/project.routes.js";
import summaryRoutes from "./routes/summary.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import benfordRoutes from "./routes/benford.routes.js";

const app = express();

app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value,
);

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mplad-backend",
  });
});

app.use("/api", summaryRoutes);

app.use("/api", projectRoutes);

app.use("/api", duplicateRoutes);

app.use("/api", alertRoutes);

app.use("/api/ml", mlRoutes);

app.use("/api/benford", benfordRoutes);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    const isValidationError =
      message.startsWith("Invalid") ||
      message.includes("must be a number") ||
      message.includes("cannot exceed");

    res.status(isValidationError ? 400 : 500).json({
      error: message,
    });
  },
);

export default app;
/*
http://localhost:3000/ministry/tier-2
http://localhost:3000/district/overview
http://localhost:3000/district/projects/2519
http://localhost:3000/district/overview#overview
http://localhost:3000/district/duplicates
http://localhost:3000/district/cost-anomalies
*/