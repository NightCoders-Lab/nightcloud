import type { Request, Response } from "express";

import { GLOBAL_ROOT_ID } from "@/config/constants";
import { CloudStorageService } from "@/services/cloud/CloudStorage.service";
import { AppError } from "@/utils";

export class CloudController {
  static readonly getCloudStorageStats = async (
    req: Request,
    res: Response,
  ) => {
    const rootId = req.query.rootId as string | undefined;
    try {
      const stats = await CloudStorageService.getCloudStorageStats(
        rootId || GLOBAL_ROOT_ID,
      );
      res.success(stats);
    } catch (err) {
      if (err instanceof AppError) throw err;
      else {
        console.log(err);
        throw new AppError(
          "INTERNAL",
          `Error al obtener las estadísticas del almacenamiento en la nube`,
        );
      }
    }
  };
}
