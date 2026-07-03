import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ContainerSize = "narrow" | "default" | "wide";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize;
};

const sizeStyles: Record<ContainerSize, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

/** Centered, horizontally padded content wrapper. */
export function Container({
  size = "default",
  className,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeStyles[size],
        className,
      )}
      {...rest}
    />
  );
}
