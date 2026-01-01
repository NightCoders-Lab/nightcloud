import "@/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "@/router";
import { queryClient } from "@/lib/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "react-loading-skeleton/dist/skeleton.css";
import { SkeletonTheme } from "react-loading-skeleton";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SkeletonTheme
        baseColor="#111C2F"
        highlightColor="#1B2640"
        borderRadius={8}
        duration={1.6}
      >
        <AppRouter />
      </SkeletonTheme>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
