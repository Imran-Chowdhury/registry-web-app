import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/*
  Colour means state, never emphasis — so the primary button is solid ink rather than a
  brand colour, and `danger` is the only variant that borrows a status colour. It is
  reserved for actions that destroy or release something (withhold, reverse, publish).
*/
const variants = {
  primary: 'bg-ink text-paper border border-ink hover:bg-ink/90 disabled:bg-ink/40 disabled:border-transparent',
  secondary: 'bg-paper text-ink border border-rule hover:bg-surface',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-rule/60',
  danger: 'bg-alert text-paper border border-alert hover:bg-alert/90',
  link: 'bg-transparent text-ink border-none underline underline-offset-2 hover:text-ink/70 px-0 h-auto',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-base',
  lg: 'h-10 px-5 text-base',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-control',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replaces the label with `pendingLabel` and disables the button while true. */
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  pending = false,
  pendingLabel,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
