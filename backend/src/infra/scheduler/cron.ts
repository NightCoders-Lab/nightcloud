import cron from "node-cron";

import { BlobCleanupService } from "@/services/blob/BlobCleanup.service.js";

import { cleanupTmpUploads } from "../cleanup/tmpUploads.cleanup.js";

// Intervalo de limpieza de archivos temporales (por defecto, cada hora)
const TMP_CLEANUP_INTERVAL =
  Number(process.env.CLOUD_TMP_CLEANUP_INTERVAL_MS) || 3600000; // 1 hora default

// Intervalo de limpieza de blobs no referenciados (por defecto, cada 60 minutos)
const ORPHANED_BLOB_CLEANUP_INTERVAL =
  Number(process.env.CLOUD_BLOB_ORPHANED_CLEANUP_INTERVAL_MS) || 14400000; // 4 horas default

// Expresión cron para los intervalos definidos
const TMP_CRON_EXPRESSION = `*/${TMP_CLEANUP_INTERVAL / 60000} * * * *`;
const ORPHANED_BLOB_CRON_EXPRESSION = `*/${ORPHANED_BLOB_CLEANUP_INTERVAL / 60000} * * * *`;

/**
 * @description Inicia los trabajos cron de la infraestructura.
 */
export function startInfraCronJobs() {
  // Programar la tarea de limpieza de archivos temporales
  cron.schedule(TMP_CRON_EXPRESSION, async () => {
    try {
      console.log("[CronJob] Ejecutando limpieza de archivos temporales...");
      await cleanupTmpUploads();
    } catch (err) {
      console.log(
        "[CronJob] Error durante la limpieza de archivos temporales:",
        err,
      );
    }
  });

  // Programar la tarea de limpieza de blobs no referenciados
  cron.schedule(ORPHANED_BLOB_CRON_EXPRESSION, async () => {
    try {
      console.log("[CronJob] Ejecutando limpieza de blobs no referenciados...");
      await BlobCleanupService.runCleanup();
    } catch (err) {
      console.log(
        "[CronJob] Error durante la limpieza de blobs no referenciados:",
        err,
      );
    }
  });
}
