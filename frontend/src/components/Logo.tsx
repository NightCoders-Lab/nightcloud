import { CiCloudOn } from "react-icons/ci";
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <CiCloudOn
        size={40}
        className="text-night-primary drop-shadow-[0_0_8px_var(--color-night-primary)]"
      />
      <span className="text-2xl font-bold text-night-text font-display tracking-tight">
        NightCloud
      </span>
    </div>
  );
}
