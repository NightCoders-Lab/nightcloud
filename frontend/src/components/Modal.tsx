import { useCtx } from "@/hooks/context/useCtx";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";

type ModalProps = {
  header?: ReactNode;
  title: string;
  size?: "small" | "medium" | "large";
  open: boolean;
  close: () => void;
  children: ReactNode;
};

export default function Modal({
  header,
  title,
  size = "medium",
  open,
  close,
  children,
}: Readonly<ModalProps>) {
  const { openCtx } = useCtx();
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCtx("modal", e.clientX, e.clientY);
  };
  const sizeClasses = {
    small: "max-w-xl",
    medium: "max-w-2xl",
    large: "max-w-4xl",
  };
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={close}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div // NOSONAR - Desactivar el aviso de sonar puesto q es solo por el context menu
            role="dialog"
            aria-modal="true"
            onContextMenu={handleContextMenu}
            className="flex items-center justify-center min-h-full p-4 text-center"
          >
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-5"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-5"
            >
              <DialogPanel
                className={`w-full ${sizeClasses[size]} p-16 overflow-hidden text-left align-middle transition-all transform bg-night-main shadow-xl rounded-2xl`}
              >
                {header}
                <DialogTitle
                  as="h3"
                  className={`truncate text-night-text text-3xl ${
                    header ? "mt-5" : ""
                  }`}
                >
                  {title}
                </DialogTitle>

                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
