import { useAppStore } from "@/stores/useAppStore";
import { useDropzone } from "react-dropzone";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { useMatch } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function UploadDropzone() {
  const matchRoot = useMatch("/");
  const matchDirectory = useMatch("/directory/:nodeId");
  const enabled = !!matchRoot || !!matchDirectory;
  const stageFiles = useAppStore((state) => state.stageFiles);
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

      // Añadir los archivos al staging
      const res = stageFiles(files) as unknown;

      // Manejar posibles errores al añadir archivos
      if (res && typeof res === "object" && "error" in res) {
        toast.error(res.error as string);
      }
    },
    multiple: true, // Permitir múltiples archivos
    maxFiles: uploadLimit, // Límite de archivos
    noClick: true, // Deshabilitar clic para abrir el diálogo
    noKeyboard: true, // Deshabilitar soporte de teclado
    disabled: !enabled,
  });

  const dropVariants = {
    idle: { scale: 1, boxShadow: "0 0 0 rgba(99,102,241,0)" },
    active: { scale: 1.05, boxShadow: "0 0 30px rgba(99,102,241,0.5)" },
  };

  return (
    <div {...getRootProps()} className="mt-10">
      <motion.div
        initial={false}
        animate={isDragActive ? "active" : "idle"}
        variants={dropVariants}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        className="flex flex-col items-center gap-3 mt-10 rounded-lg bg-night-primary/15 backdrop-blur-md ring-1 ring-night-primary/30 px-10 py-8 text-night-text border-dashed border-2 border-night-primary/50"
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <HiOutlineCloudUpload className="text-5xl text-night-primary/80" />
        </motion.div>

        <p className="text-lg font-medium">Drop files or folders to upload</p>

        <p className="text-sm text-night-muted">
          The files will be uploaded to the selected directory
        </p>
      </motion.div>
    </div>
  );
}
