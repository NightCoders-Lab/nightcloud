import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { useMatch, useParams } from "react-router-dom";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { useUploadFiles } from "@/hooks/upload/useUploadFiles";
import classNames from "@/utils/classNames";
import { useGlobalFileDrag } from "@/hooks/useGlobalFileDrag";
import { toast } from "react-toastify";

export default function GlobalDropzone() {
  const matchRoot = useMatch("/");
  const matchDirectory = useMatch("/directory/:nodeId");
  const { nodeId: parentId } = useParams();
  const enabled = !!matchRoot || (!!matchDirectory && !!parentId);
  const { uploadFiles } = useUploadFiles(parentId || null);
  const isGlobalDragActive = useGlobalFileDrag();
  const uploadLimit = Number(import.meta.env.VITE_API_UPLOAD_FILES_LIMIT) || 10;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files, fileRejections) => {
      if (fileRejections.length > 0) {
        if (fileRejections[0].errors[0].code === "too-many-files") {
          return toast.error(
            `You can upload up to ${uploadLimit} files at once`
          );
        }

        if (fileRejections[0].errors[0].code === "file-invalid-type") {
          return toast.error("Some files have an invalid file type");
        }

        return toast.error("Some files were rejected");
      }

      // Iniciar la mutación de subida de archivos
      uploadFiles(files);
    },
    multiple: true, // Permitir múltiples archivos
    noClick: true, // Deshabilitar clic para abrir el diálogo
    noKeyboard: true, // Deshabilitar soporte de teclado
    disabled: !enabled,
  });

  const rootVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const dropVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  };

  if (!enabled) return null;

  return (
    <>
      {isGlobalDragActive && (
        <div
          {...getRootProps()}
          className={classNames(
            "fixed inset-0 z-50 transition-all duration-100 pointer-events-auto"
          )}
        >
          <input {...getInputProps()} />

          <AnimatePresence>
            {isDragActive && (
              <div className="fixed inset-0 z-50 pointer-events-none">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={rootVariants}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropVariants}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex flex-col items-center gap-3 rounded-lg bg-night-primary/15 backdrop-blur-md ring-1 ring-night-primary/30 px-10 py-8 text-night-text shadow-xl shadow-black/40"
                  >
                    <HiOutlineCloudUpload className="text-5xl text-night-primary/80" />

                    <p className="text-lg font-medium">
                      Drop files or folders to upload
                    </p>

                    <p className="text-sm text-night-muted">
                      The files will be uploaded to the current directory
                    </p>
                  </motion.div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
