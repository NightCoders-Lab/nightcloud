import type { NodeType } from "@/types";
import {
  Transition,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { BsThreeDots } from "react-icons/bs";
import {
  HiOutlinePencil,
  HiOutlineFolderOpen,
  HiOutlineDuplicate,
  HiOutlineTrash,
  HiOutlineDownload,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { downloadNode } from "@/api/NodeAPI";

type NodeActionsProps = {
  node: NodeType;
};

export default function NodeActions({ node }: Readonly<NodeActionsProps>) {
  // Navegación para abrir los modales correspondientes
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    navigate(
      `${location.pathname}?action=${action}&scope=single&targetId=${node.id}`
    );
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton className="block p-1.5 rounded-full cursor-pointer hover:bg-white/10 text-night-muted hover:text-white transition-colors focus:outline-none">
        <span className="sr-only">Folder options</span>
        <BsThreeDots className="text-lg" />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems
          portal
          anchor="bottom end"
          className="fixed mt-2 w-56 p-2 origin-top-right bg-night-surface border border-night-border rounded-md shadow-lg ring-1 ring-night-border/50 focus:outline-none z-50"
        >
          <MenuItem>
            <button
              onClick={() => downloadNode(node.id)}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
            >
              <HiOutlineDownload className="mr-3 text-lg" />
              <span className="tracking-wider">Download</span>
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => handleAction("rename")}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
            >
              <HiOutlinePencil className="mr-3 text-lg" />
              <span className="tracking-wider">Rename</span>
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => handleAction("move")}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
            >
              <HiOutlineFolderOpen className="mr-3 text-lg" />
              <span className="tracking-wider">Move</span>
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => handleAction("copy")}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-night-text hover:bg-night-border/50 hover:text-white transition-colors rounded-md hover:cursor-pointer"
            >
              <HiOutlineDuplicate className="mr-3 text-lg" />
              <span className="tracking-wider">Copy</span>
            </button>
          </MenuItem>
          <div className="my-2 border-t border-night-border/30" />
          <MenuItem>
            <button
              onClick={() => handleAction("delete")}
              className="flex items-center w-full px-3 py-1 overflow-hidden text-sm font-semibold leading-6 text-left text-red-400 hover:bg-night-border/50 hover:text-red-300 transition-colors rounded-md hover:cursor-pointer"
            >
              <HiOutlineTrash className="mr-3 text-lg" />
              <span className="tracking-wider">Remove</span>
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
