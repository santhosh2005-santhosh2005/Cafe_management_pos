import React from "react";
import { cn } from "@/lib/utils";

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const BrutalistButton: React.FC<BrutalistButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const variants = {
    primary: "bg-electric-lime text-forest-green",
    secondary: "bg-forest-green text-white",
    accent: "bg-golden-yellow text-deep-black",
    ghost: "bg-white text-deep-black"
  };

  const sizes = {
    sm: "h-10 px-4 text-xs",
    md: "h-14 px-8 text-sm",
    lg: "h-20 px-12 text-xl",
    icon: "h-14 w-14 flex items-center justify-center p-0"
  };

  return (
    <button
      className={cn(
        "font-heading uppercase italic border-4 border-deep-black brutalist-shadow-sm transition-all duration-75 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none",
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
