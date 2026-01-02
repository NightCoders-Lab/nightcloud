import multer from "multer";

import { localStorage } from "./multer.storage";

// Multer upload instance
export const multerUpload = multer({
  storage: localStorage,
  limits: {
    // Permitir solamente archivos de hasta 5 GB por ahora
    fileSize: 5 * 1024 * 1024 * 1024, // 5 GB

    // Aunque en realidad el frontend enviara de 30,
    // Limitar a un máximo de 50 archivos por solicitud
    files: 50,

    // Limitar el tamaño de los campos de texto enviados junto con los archivos
    // para evitar ataques de denegación de servicio
    // 2MB es mas que suficiente con los campos q tiene el form del frontend
    // Ej: parentId, path, etc...
    fieldSize: 2 * 1024 * 1024, // 2 MB por campo

    // Limitar la cantidad de campos de texto enviados junto con los archivos
    // para evitar ataques de denegación de servicio
    // 20 campos es mas que suficiente con los campos q tiene el form del frontend
    // Ej: parentId, path, etc...
    fields: 20,

    // En realidad la suma de los archivos y campos no superara 50 + 20 = 70 (aparte de que ni son 50, sino 30 archivos)
    // Pero para mayor seguridad, limitar la suma total a 100
    parts: 100, // Limitar el total de partes (archivos + campos) a 100
  },
  fileFilter: (_req, _file, cb) => {
    // Aceptar todos los tipos de archivos por ahora
    // En un futuro podria filtrarse por archivos peligrosos como .exe, .bat, .cmd, etc.
    // Para evitar alojar archivos ejecutables que puedan comprometer la seguridad del servidor
    cb(null, true);
  },
});
