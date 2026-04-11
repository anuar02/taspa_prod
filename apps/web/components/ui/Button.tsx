import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-light",
        variant === "secondary" && "border border-border bg-surface text-text hover:bg-bg",
        variant === "ghost" && "bg-transparent text-muted hover:text-text",
        className
      )}
      {...props}
    />
  );
}
