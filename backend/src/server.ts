import "dotenv/config";
import { createApp } from "@/app";
import { DB } from "@/config/db";

import { startInfraCronJobs } from "./infra/scheduler/cron";

/**
 *  Inicializa la aplicación, conecta a la base de datos y arranca el servidor
 */
async function initApp() {
  try {
    // Connect to the database
    await DB.getClient().$connect();

    // Create the Express application
    const app = createApp();
    const port = process.env.PORT || 4000;

    // Start the server
    app.listen(port, () => {
      console.log("Server is running on port", port);
    });

    // Start scheduled cron jobs
    startInfraCronJobs();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Start the application
await initApp();
