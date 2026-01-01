import { Router, type Express } from "express";

// Import all routes
import Cloud from "@/routes/cloud.routes";
import Nodes from "@/routes/nodes.routes";

export function registerV1Routes(app: Express) {
  // API v1 routes
  const v1 = Router();

  // Mount the v1 routes
  //v1.use("/auth", Auth);

  // Nodes routes
  v1.use("/nodes", Nodes);

  // Cloud routes
  v1.use("/cloud", Cloud);

  // Health check endpoint
  v1.use("/health", (_req, res) => {
    res.send("The API is working correctly");
  });

  // Use the v1 routes with the /api/v1 prefix
  app.use("/api/v1", v1);
}
