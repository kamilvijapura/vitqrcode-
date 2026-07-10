import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn, initials as toInitials } from "@/lib/utils";

/* ------------------------------- Card ------------------------------- */

export function Card({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-content">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Button ------------------------------ */

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground hover:opacity-90 shadow-sm shadow-brand/30",
  secondary:
    "bg-content text-bg hover:opacity-90",
  outline:
    "border border-border-strong bg-transparent text-content hover:bg-surface-2",
  ghost: "bg-transparent text-content hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  soft: "bg-brand-soft text-brand hover:bg-brand-soft/70",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(({ className, variant = "primary", size = "md", children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-xl font-medium ring-focus transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = "Button";

/* ------------------------------- Badge ------------------------------ */

type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand"
  | "neutral"
  | "accent";

const badgeTones: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand",
  accent: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
  neutral: "bg-surface-2 text-muted border border-border",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ----------------------------- StatCard ----------------------------- */

export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaTone = "success",
  accent,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  delta?: string;
  deltaTone?: "success" | "danger" | "neutral";
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08]"
        style={{ background: accent ?? "var(--color-brand)" }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: accent ?? "var(--color-brand)" }}
        >
          {icon}
        </div>
        {delta && (
          <span
            className={cn(
              "text-xs font-semibold",
              deltaTone === "success" && "text-success",
              deltaTone === "danger" && "text-danger",
              deltaTone === "neutral" && "text-muted",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-content">
          {value}
        </div>
        <div className="mt-0.5 text-sm text-muted">{label}</div>
      </div>
    </Card>
  );
}

/* ---------------------------- ProgressBar --------------------------- */

export function ProgressBar({
  value,
  className,
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    brand: "var(--color-brand)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tones[tone] }}
      />
    </div>
  );
}

/* ------------------------------ Avatar ------------------------------ */

export function Avatar({
  name,
  src,
  size = 40,
  className,
  fallbackIcon,
}: {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand overflow-hidden",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="h-full w-full rounded-full object-cover" />
      ) : name ? (
        <span>{toInitials(name)}</span>
      ) : (
        <span className="flex items-center justify-center opacity-70">{fallbackIcon ?? "?"}</span>
      )}
    </div>
  );
}

/* --------------------------- EmptyState ----------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-content">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ----------------------------- Skeleton ----------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

/* --------------------------- Form fields ---------------------------- */

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border-strong bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-subtle ring-focus transition-colors focus:border-brand";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputBase, "resize-none", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(inputBase, "cursor-pointer", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

/* ----------------------------- Spinner ------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
