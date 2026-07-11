"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  Apple,
  LineChart,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/training", label: "Entreno", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrición", icon: Apple },
  { href: "/routines", label: "Rutinas", icon: LineChart },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50">
      <main className="flex-1 px-4 pb-24 pt-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md justify-between px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs"
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-slate-900" : "text-slate-400"
                  )}
                />
                <span className={cn(active ? "text-slate-900" : "text-slate-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}