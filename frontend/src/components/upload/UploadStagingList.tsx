import { FileCategoryIcons } from "@/data/fileCategoryIcons";
import { useUploadStage } from "@/hooks/upload/useUploadStage";
import classNames from "@/utils/classNames";
import { getCategoryFromMime } from "@/utils/files/getCategoryFromExtAndMime";
import getHumanFileSize from "@/utils/files/getHumanFileSize";
import { motion } from "framer-motion";

export default function UploadStagingList() {
  const { stagedFiles, removeFileFromStaging } = useUploadStage();

  if (stagedFiles.length === 0) {
    return (
      <div className="p-4 text-center text-night-muted tracking-wider rounded-lg border border-night-border divide-y divide-night-border">
        No files uploaded yet
      </div>
    );
  }

  const extendColumn = stagedFiles.length % 2 !== 0;

  return (
    <div className="grid grid-cols-2 max-h-40 overflow-y-auto rounded-lg border border-night-border divide-y divide-x divide-night-border">
      {stagedFiles.map((data) => {
        const category = getCategoryFromMime(data.file.type);
        const Icon = FileCategoryIcons[category];

        return (
          <motion.div
            key={data.id}
            className={classNames(
              extendColumn &&
                stagedFiles.length - 1 === stagedFiles.indexOf(data)
                ? "col-span-2"
                : "",
              "flex items-center justify-between gap-2 px-4 py-3 hover:bg-night-surface/60 transition-all"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="text-2xl text-night-muted shrink-0" />
              <span
                className={classNames(
                  extendColumn &&
                    stagedFiles.length - 1 === stagedFiles.indexOf(data)
                    ? "max-w-100"
                    : "max-w-42",
                  "text-night-text truncate"
                )}
              >
                {data.file.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-night-muted text-sm">
              {getHumanFileSize(data.file.size)}
              <button
                onClick={() => removeFileFromStaging(data)}
                className="px-2 py-1 rounded-full uppercase bg-red-900/30 text-red-400 transition hover:cursor-pointer hover:bg-red-900/50 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
