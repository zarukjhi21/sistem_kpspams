import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "brand";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "neutral", size = "md", className = "" }: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  const variantClasses = {
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold",
    warning: "bg-amber-50 text-amber-900 border border-amber-300 font-bold",
    danger: "bg-rose-50 text-rose-800 border border-rose-200/90 font-bold",
    info: "bg-sky-50 text-sky-800 border border-sky-200/90 font-bold",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold",
    brand: "bg-brand-maroon-50 text-brand-maroon-900 border border-brand-maroon-200/90 font-bold",
  }[variant];

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-lg tracking-wide uppercase ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
