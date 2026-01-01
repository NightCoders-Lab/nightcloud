import type { NodeMoveFormData, NodeType } from "@/types";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";
import ErrorMessage from "@/components/ErrorMessage";
import { HiOutlinePencil } from "react-icons/hi";
import capitalizeFirstLetter from "@/utils/capitalizeFirstLetter";

type CreateFolderProps = {
  register: UseFormRegister<NodeMoveFormData>;
  errors: FieldErrors<NodeMoveFormData>;
  isDir: NodeType["isDir"];
};

export default function MoveNodeForm({
  register,
  errors,
  isDir,
}: Readonly<CreateFolderProps>) {
  const nodeType = isDir ? "folder" : "file";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="name" className="flex items-center gap-3">
        <HiOutlinePencil className="w-5 h-5 text-night-muted" />
        <span className="tracking-wider text-md font-bold text-night-text">
          {capitalizeFirstLetter(nodeType)} name
        </span>
      </label>
      <input
        id="name"
        type="text"
        placeholder={`e.g. My Moved ${capitalizeFirstLetter(nodeType)}`}
        className="w-full p-3 border border-night-border rounded-lg bg-night-surface text-night-text focus:outline-none focus:ring-2 focus:ring-night-primary focus:border-transparent placeholder-night-muted"
        {...register("name")}
      />

      {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
    </div>
  );
}
