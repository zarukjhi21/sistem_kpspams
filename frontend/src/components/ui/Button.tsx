import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-2 text-xs min-h-[38px] sm:min-h-[36px]",
    md: "px-4 py-2.5 text-sm min-h-[44px]",
    lg: "px-5 py-3 text-base min-h-[48px]",
  }[size];

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black text-white font-semibold shadow-md shadow-brand-maroon-950/20 active:scale-[0.98]",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 font-semibold shadow-sm active:scale-[0.98]",
    gold:
      "bg-gradient-to-r from-brand-gold-500 to-amber-500 hover:from-brand-gold-600 hover:to-amber-600 text-brand-maroon-950 font-bold shadow-md shadow-amber-500/20 active:scale-[0.98]",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md shadow-rose-900/20 active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 font-medium active:scale-[0.98]",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold active:scale-[0.98]",
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center space-x-2 rounded-xl transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
