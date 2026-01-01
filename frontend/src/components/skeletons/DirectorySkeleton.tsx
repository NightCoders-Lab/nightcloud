import Skeleton from "react-loading-skeleton";

type DirectorySkeletonProps = {
  filesCount?: number;
};

export default function DirectorySkeleton({
  filesCount = 10,
}: Readonly<DirectorySkeletonProps>) {
  return (
    <>
      <div className="flex items-center justify-between h-14 px-4 shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <Skeleton width={24} height={24} className="rounded-md" />
          <div className="flex items-center gap-1 text-xl font-bold leading-none rounded-lg bg-night-surface/60 backdrop-blur-md border border-night-border/40 px-3 py-1 overflow-hidden">
            <Skeleton width={100} height={24} className="rounded-lg" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Skeleton width={150} height={40} className="rounded-lg" />
        </div>
      </div>

      <div className="flex justify-around px-4 py-2 border-b border-night-border/30 mb-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={"skeleton-header-" + index} className="w-1/5 px-2">
            <Skeleton height={20} className="rounded-md" />
          </div>
        ))}
      </div>

      {/* El contenedor de la tabla crece para ocupar el resto del espacio */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {Array.from({ length: filesCount }).map((_, index) => (
          <div key={"skeleton-row-" + index} className="px-4 py-2">
            <Skeleton height={28} className="rounded-md" />
          </div>
        ))}
      </div>
    </>
  );
}
