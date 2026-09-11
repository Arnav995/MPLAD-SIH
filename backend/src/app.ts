import express from "express";
const app = express();

app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value,
);
import duplicateRoutes from "./routes/duplicate.routes.js";
import projectRoutes from "./routes/project.routes.js";
import summaryRoutes from "./routes/summary.routes.js";
import alertRoutes from "./routes/alert.routes.js";

app.use(express.json());

app.get("/api/health", (req,res)=>{
     res.json({
          status:"ok",
          service: "mplad-backend"
     })
})

app.use(
  "/api",
  summaryRoutes,
);

app.use("/api",projectRoutes,);
app.use("/api", duplicateRoutes);
app.use("/api", alertRoutes);

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
      message.includes(
        "must be a number",
      ) ||
      message.includes(
        "cannot exceed",
      );

    res.status(
      isValidationError
        ? 400
        : 500,
    ).json({
      error: message,
    });
  },
);
export default app;