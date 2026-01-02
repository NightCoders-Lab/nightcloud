import { FileCategoryIcons } from "@/data/fileCategoryIcons";
import { useUploadStage } from "@/hooks/upload/useUploadStage";
import { chunk } from "@/utils/chunk";
import classNames from "@/utils/classNames";
import { getCategoryFromMime } from "@/utils/files/getCategoryFromExtAndMime";
import getHumanFileSize from "@/utils/files/getHumanFileSize";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

export default function UploadStagingList() {
  const { stagedFiles, removeFileFromStaging } = useUploadStage();
  const parentRef = useRef<HTMLDivElement>(null);

  // Dividir todos los archivos en el stage en filas de 2 archivos cada una
  const rows = useMemo(() => chunk(stagedFiles, 2), [stagedFiles]);

  // Configuracion del virtualizer para las filas calculadas previamente
  // La alerta desactivada es del eslint ya que el virtualizer no se puede memoizar 
  // ya que siempre se necesita actualizar al cambiar el scroll
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 4,
  });

  if (stagedFiles.length === 0) {
    return (
      <div className="p-4 text-center text-night-muted tracking-wider rounded-lg border border-night-border divide-y divide-night-border">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="relative max-h-40 overflow-y-auto rounded-lg border border-night-border divide-y divide-night-border"
    >
      <div
        className="relative divide-y divide-x divide-night-border"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          // Obtener la fila correspondiente al índice virtual
          const row = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="h-full grid grid-cols-2 divide-x divide-night-border">
                {row.map((data) => {
                  const category = getCategoryFromMime(data.file.type);
                  const Icon = FileCategoryIcons[category];

                  return (
                    <div
                      key={data.id}
                      className={classNames(
                        row.length === 1 ? "col-span-2" : "",
                        "flex items-center justify-between px-4 py-3 hover:bg-night-surface/60 transition-all"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="text-2xl text-night-muted shrink-0" />
                        <span
                          className={classNames(
                            "text-night-text truncate max-w-100 select-none"
                          )}
                        >
                          {data.file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-night-muted text-sm select-none">
                        {getHumanFileSize(data.file.size)}
                        <button
                          onClick={() => removeFileFromStaging(data)}
                          className="px-2 py-1 rounded-full uppercase bg-red-900/30 text-red-400 transition hover:cursor-pointer hover:bg-red-900/50 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
