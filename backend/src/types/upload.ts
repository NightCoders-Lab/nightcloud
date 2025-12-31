// Type para una entrada en el manifiesto de subida de archivos
export type UploadManifestEntry = {
  name: string;
  path: string;
  size: string;
  mimeType: string;
};

// Type para movimientos pendientes de archivos subidos
export type PendingMoves = {
  tmpPath: string;
  finalPath: string;
};
