import type { Request } from "express";
import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";

import { AppError } from "@/utils";

import { LocalCloudStorage } from "../cloud/LocalCloudStorage";

// Instancia de LocalCloudStorage
const storage = new LocalCloudStorage();

// Configuración del almacenamiento local con multer
export const localStorage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    storage
      .ensureTmp()
      .then((tmpDir) => cb(null, tmpDir))
      .catch((err) => {
        console.error(err);
        cb(
          new AppError(
            "INTERNAL",
            "Ha ocurrido un error interno al subir el archivo",
          ),
          "",
        );
      });
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    // Generar un nombre de archivo unico usando UUID y conservar la extension original
    cb(null, crypto.randomUUID() + path.extname(file.originalname));
  },
});
