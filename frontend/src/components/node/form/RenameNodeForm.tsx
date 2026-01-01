import type { NodeRenameFormData, NodeType } from "@/types";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import ErrorMessage from "@/components/ErrorMessage";

type CreateFolderProps = {
  register: UseFormRegister<NodeRenameFormData>;
  errors: FieldErrors<NodeRenameFormData>;
  node: NodeType;
};

export default function RenameNodeForm({
  register,
  errors,
  node,
}: Readonly<CreateFolderProps>) {
  const nodeLabel = node.isDir ? "folder" : "file";

  return (
    <div className="flex flex-col gap-2">
      <input
        id="name"
        type="text"
        placeholder="e.g. new_photos"
        className="w-full mt-5 p-3 border border-night-border rounded-lg bg-night-surface text-night-text focus:outline-none focus:ring-2 focus:ring-night-primary focus:border-transparent placeholder-night-muted"
        {...register("name", {
          required: `${nodeLabel} name is mandatory`,
        })}
      />

      {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
    </div>
  );
}
