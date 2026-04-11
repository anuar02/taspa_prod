import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
        variant === "primary" && "bg-primary text-white shadow-card hover:bg-primary-light",
        variant === "secondary" && "bg-surface text-text ring-1 ring-border hover:bg-white",
        variant === "ghost" && "bg-transparent text-muted hover:text-text",
        className
      )}
      {...props}
    />
  );
}
