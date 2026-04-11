import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "min-h-[48px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/15",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
