import { createNodeFolder } from "@/api/NodeAPI";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type CreateNodeFolderParams = {
  parentId: string | null;
  name: string;
};

export function useCreateNodeFolder() {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: ({ parentId, name }: CreateNodeFolderParams) =>
      createNodeFolder({ name, parentId: parentId ?? undefined }),
    onSuccess: (data) => {
      const parentId = data.parentId === data.rootId ? "root" : data.parentId;

      queryClient.invalidateQueries({
        queryKey: ["nodes", parentId ?? "root"],
      });
      toast.success("Folder created successfully", { autoClose: 1000 });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    createNodeFolder: mutate,
    createNodeFolderAsync: mutateAsync,
    isPending,
  };
}
