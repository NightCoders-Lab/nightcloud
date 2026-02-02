import type { CorsOptions } from "cors";

/**
 * @description Configuración de CORS para la aplicación Express.
 */
export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests from FRONTEND_URL and localhost during development
    const frontendUrls = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split("|")
      : []; // Now supports multiple urls
    const whitelist = [
      ...frontendUrls,
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      // Allow requests with no origin only in development
      if (!origin && process.env.NODE_ENV === "development")
        return callback(null, true);

      // else reject the request
      callback(null, false);
    }
  },
  credentials: true,
};
