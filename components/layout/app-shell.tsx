"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  ClipboardList,
  Dumbbell,
  Home,
  LineChart,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/training", label: "Ejercicios", icon: Dumbbell },
  { href: "/routines", label: "Rutinas", icon: ClipboardList },
  { href: "/progress", label: "Progreso", icon: LineChart },
  { href: "/nutrition", label: "Nutricion", icon: Apple },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.href !== "/settings");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 text-slate-950">
      <main className="flex-1 px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px]",
                  active ? "bg-slate-100" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-slate-950" : "text-slate-400"
                  )}
                />
                <span
                  className={cn(
                    "w-full truncate text-center",
                    active ? "text-slate-950" : "text-slate-400"
                  )}
                >
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
