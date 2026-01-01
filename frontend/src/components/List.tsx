import { useList } from "@/hooks/stores/useList";
import type { ListOption } from "@/stores/listSlice";
import classNames from "@/utils/classNames";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { HiCheckCircle, HiChevronDown } from "react-icons/hi";

type ListProps = {
  options: ListOption[];
  defaultOption?: ListOption;
  maxHeight?: "large" | "normal" | "small";
};

export default function List({
  options,
  defaultOption,
  maxHeight = "normal",
}: Readonly<ListProps>) {
  const { listSelectedOption, listSetSelectedOption } = useList();
  // Establecer la opción por defecto si se proporciona y no hay ninguna seleccionada
  useEffect(() => {
    if (defaultOption && !listSelectedOption) {
      listSetSelectedOption(defaultOption);
    }
  }, [defaultOption, listSelectedOption, listSetSelectedOption]);

  const maxHeightClass = {
    large: "max-h-80",
    normal: "max-h-60",
    small: "max-h-40",
  }[maxHeight];

  return (
    <Listbox as="div" className="relative" onChange={listSetSelectedOption}>
      {({ open }) => (
        <>
          <ListboxButton className="p-2 px-4 bg-night-surface rounded-lg border border-night-border hover:cursor-pointer w-full focus:outline-0 flex justify-between items-center">
            {listSelectedOption ? (
              <div className="flex items-center gap-3">
                {listSelectedOption.icon && (
                  <div className="text-night-muted">
                    <listSelectedOption.icon />
                  </div>
                )}
                {listSelectedOption.name}
              </div>
            ) : (
              <span className="text-night-muted">Select an option</span>
            )}
            <HiChevronDown
              className={classNames(
                open ? "rotate-180" : "",
                "text-xl text-night-text transform transition-all duration-300"
              )}
            />
          </ListboxButton>
          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <ListboxOptions
              portal
              anchor="bottom end"
              // CAJA EXTERIOR:
              // 1. Quitamos 'p-2'
              // 2. Quitamos 'overflow-y-auto' y 'divide-y'
              // 3. Quitamos 'max-h' (se lo pasamos al hijo)
              // 4. Mantenemos 'overflow-hidden' para recortar las esquinas
              className="fixed w-(--button-width) my-2 border border-night-border rounded-lg bg-night-surface focus:outline-0 shadow-lg overflow-hidden z-50"
            >
              {/* CAJA INTERIOR: Se encarga del scroll y el espaciado interno */}
              <div
                className={classNames(
                  maxHeightClass, // La altura máxima va AQUI
                  "overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-night-border scrollbar-track-transparent"
                )}
              >
                {listSelectedOption && (
                  <ListboxOption
                    value={null}
                    className="mb-1 pb-1 p-2 group hover:cursor-pointer rounded-md mx-1 transition-all duration-150 cursor-pointer"
                  >
                    <span className="text-night-muted transform transition-all duration-150 group-hover:text-night-text">
                      --- Select an option ---
                    </span>
                  </ListboxOption>
                )}

                {Object.entries(options).map(([, option]) => (
                  <ListboxOption
                    key={option.id}
                    value={option}
                    className={({ focus }) =>
                      classNames(
                        "flex justify-between gap-2 p-2 group hover:cursor-pointer rounded-md mx-1 transition-all duration-150 cursor-pointer",
                        "border-b border-night-muted/20 last:border-0 mb-1 last:mb-0",
                        listSelectedOption?.id === option.id
                          ? "bg-night-primary/20 border-night-primary/20"
                          : "",
                        focus ? "bg-night-primary/10" : ""
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <div className="text-night-muted transform transition-all duration-150 group-hover:text-night-text group-hover:translate-x-1">
                          <option.icon />
                        </div>
                      )}
                      <span className="text-night-muted transform transition-all duration-150 group-hover:translate-x-1 group-hover:text-night-text">
                        {option.name}
                      </span>
                    </div>
                    {listSelectedOption?.id === option.id && (
                      <HiCheckCircle className="w-5 h-5 text-night-text opacity-80" />
                    )}
                  </ListboxOption>
                ))}
              </div>
            </ListboxOptions>
          </Transition>
        </>
      )}
    </Listbox>
  );
}
