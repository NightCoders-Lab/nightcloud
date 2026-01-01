import type { NodeFolderFormData } from "@/types";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import ErrorMessage from "@/components/ErrorMessage";

type CreateFolderProps = {
  register: UseFormRegister<NodeFolderFormData>;
  errors: FieldErrors<NodeFolderFormData>;
};

export default function CreateFolderForm({
  register,
  errors,
}: Readonly<CreateFolderProps>) {
  return (
    <div className="flex flex-col gap-2">
      <input
        id="name"
        type="text"
        placeholder="e.g. My Documents"
        autoComplete="off"
        className="w-full mt-5 p-3 border border-night-border rounded-lg bg-night-surface text-night-text focus:outline-none focus:ring-2 focus:ring-night-primary focus:border-transparent placeholder-night-muted"
        {...register("name", {
          required: "Folder name is mandatory",
        })}
      />

      {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
    </div>
  );
}
