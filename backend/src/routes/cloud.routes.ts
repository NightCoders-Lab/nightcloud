import { Router } from "express";

import { CloudController } from "@/controllers/Cloud.controller";

// Rutas para la gestión del almacenamiento en la nube
const router = Router();

// Endpoint para obtener estadísticas del almacenamiento en la nube
router.get("/stats", CloudController.getCloudStorageStats);

export default router;
