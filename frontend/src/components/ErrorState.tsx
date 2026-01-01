import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import type { IconType } from "react-icons/lib";

type ErrorStateProps = {
  title?: string;
  Icon?: IconType;
  children?: React.ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
  btnMessage?: string;
};

export default function ErrorState({
  title,
  Icon,
  children,
  onRetry,
  isRetrying,
  btnMessage,
}: Readonly<ErrorStateProps>) {
  const defaultTitle = "Oops! Something went wrong.";
  const defaultMessage = (
    <>
      There was an error while retrieving your files.
      <br />
      Please try again later.
    </>
  );

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="flex flex-col items-center text-center gap-4 px-14 py-12
            bg-night-surface/60 backdrop-blur-sm border border-night-border/10 rounded-xl"
      >
        {Icon ? (
          <Icon size={44} className="text-night-muted" />
        ) : (
          <FiAlertTriangle size={44} className="text-night-muted" />
        )}

        <div className="flex flex-col gap-1">
          <h2 className="text-night-text font-semibold text-lg leading-tight">
            {title || defaultTitle}
          </h2>
          <p className="text-night-muted/90 text-sm mt-3 leading-relaxed max-w-sm wrap-break-word">
            {children || defaultMessage}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-night-primary text-night-text text-sm transition-all duration-150 ease-out hover:bg-night-primary-hover/90 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-night-primary-hover/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRetrying && (
              <div className="w-5 h-5 border-2 border-t-transparent border-night-text rounded-full animate-spin"></div>
            )}
            {btnMessage || "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}
