import type { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
