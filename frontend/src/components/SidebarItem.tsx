import classNames from "@/utils/classNames";
import React from "react";
import { NavLink } from "react-router-dom";

type SidebarItemProps = {
  item: {
    label: string;
    url: string;
    icon: React.ComponentType<{ size?: number }>;
  };
};
export default function SidebarItem({ item }: Readonly<SidebarItemProps>) {
  return (
    <li key={item.label}>
      <NavLink
        to={item.url}
        className={({ isActive }) =>
          classNames(
            isActive
              ? "bg-night-primary/10 text-night-primary border border-night-primary/20"
              : "text-night-muted hover:text-night-text hover:bg-white/5",
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 font-medium"
          )
        }
      >
        <item.icon size={18} />
        {item.label}
      </NavLink>
    </li>
  );
}
