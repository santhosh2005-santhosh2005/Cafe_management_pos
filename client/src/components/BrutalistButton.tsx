import React from "react";
import { cn } from "@/lib/utils";

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
}

const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const variants = {
    primary: "bg-deep-black text-white hover:bg-white hover:text-deep-black",
    secondary: "bg-white text-deep-black hover:bg-golden-yellow",
    accent: "bg-golden-yellow text-deep-black hover:bg-white",
    ghost: "bg-transparent text-deep-black border-2 hover:bg-deep-black hover:text-white",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-10 px-4 text-xs",
    md: "h-12 px-8 text-sm",
    lg: "h-16 px-10 text-lg",
    xl: "h-20 px-12 text-xl",
  };

  return (
    <button
      className={cn(
        "font-black uppercase italic tracking-tighter border-4 border-deep-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default BrutalistButton;
