import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  icon: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  external?: never;
};

type LinkProps = BaseProps & {
  href: string;
  external?: boolean;
  onClick?: never;
};

export type ActionTileProps = ButtonProps | LinkProps;

const baseClass =
  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-1.5 text-center text-[10px] font-semibold leading-tight transition disabled:opacity-50";

function tileClass({ danger, className }: Pick<BaseProps, "danger" | "className">) {
  return cn(
    baseClass,
    danger
      ? "border-red-200 text-red-700 hover:bg-red-50"
      : "border-slate-200 text-slate-800 hover:bg-slate-50",
    className
  );
}

function content(icon: ReactNode, label: string) {
  return (
    <>
      <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
      <span>{label}</span>
    </>
  );
}

export function ActionTile(props: ActionTileProps) {
  if (typeof props.href === "string") {
    const { href, external, label, icon, danger, disabled, className } = props;

    if (disabled) {
      return (
        <span title={label} aria-label={label} className={cn(tileClass({ danger, className }), "opacity-50")}>
          {content(icon, label)}
        </span>
      );
    }

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          aria-label={label}
          className={tileClass({ danger, className })}
        >
          {content(icon, label)}
        </a>
      );
    }

    return (
      <Link href={href} title={label} aria-label={label} className={tileClass({ danger, className })}>
        {content(icon, label)}
      </Link>
    );
  }

  const { label, icon, danger, disabled, className, onClick } = props;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={tileClass({ danger, className })}
    >
      {content(icon, label)}
    </button>
  );
}
