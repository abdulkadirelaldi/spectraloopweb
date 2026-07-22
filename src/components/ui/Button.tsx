import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
};

// Polymorphic: renders a Next.js <Link> when `href` is set, otherwise <button>.
type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[transform,background-color,box-shadow,opacity,border-color] " +
  "duration-200 active:scale-[0.97] focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:pointer-events-none " +
  "disabled:opacity-50 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "bg-foreground text-background hover:opacity-90",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-brand-50 dark:hover:bg-white/5",
  ghost:
    "bg-transparent text-foreground hover:bg-brand-50 dark:hover:bg-white/5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const classes = cn(base, variantStyles[variant], sizeStyles[size], className);

  if (props.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<
      ButtonAsLink,
      keyof BaseProps
    >;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as Omit<ButtonAsButton, keyof BaseProps>)}
    >
      {children}
    </button>
  );
}
