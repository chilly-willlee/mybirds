import type { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
