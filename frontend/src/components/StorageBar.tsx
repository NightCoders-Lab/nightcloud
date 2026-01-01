import { getCloudStats } from "@/api/CloudAPI";
import { useQuery } from "@tanstack/react-query";

export default function StorageBar() {
  const { data, isLoading, error } = useQuery({
    queryFn: getCloudStats,
    queryKey: ["cloudStats"],
  });

  let percentage = 0;

  if (!isLoading && !error && data) {
    const used = Number(data.disk.used);
    const total = Number(data.disk.total);

    if (total > 0) {
      percentage = Math.round((used / total) * 100);
    }
  }

  let color = "bg-night-primary";

  if (percentage >= 65 && percentage < 90) {
    color = "bg-yellow-600";
  } else if (percentage >= 90) {
    color = "bg-red-600";
  }

  return (
    <div className="mt-auto pt-6 border-t border-night-border">
      <div className="flex justify-between text-xs text-night-muted mb-2 font-mono">
        <span>Storage</span>
        <span className="text-center">{percentage}%</span>
      </div>

      <div className="w-full bg-night-border rounded-full h-1.5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full shadow-[0_0_10px_var(--color-night-primary)] transition-all duration-300`}
          style={{ width: `${percentage}%` }} // Ancho dinámico basado en el porcentaje
        />
      </div>
    </div>
  );
}
