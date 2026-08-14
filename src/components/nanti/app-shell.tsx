import { Link, useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Sun,
  Inbox,
  Hourglass,
  FolderKanban,
  Users,
  MessageSquareText,
  Settings as Cog,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { useNanti } from "@/lib/nanti-store";
import { useImportDialog } from "./import-dialog";
import { isOverdue, openItems } from "@/lib/nanti-utils";

const mainNav = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/waiting", label: "Waiting", icon: Hourglass },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/people", label: "People", icon: Users },
] as const;

const bottomNav = [
  { to: "/ai", label: "Ask NANTI", icon: MessageSquareText },
  { to: "/settings", label: "Settings", icon: Cog },
] as const;

const mobileNav = [...mainNav.filter((n) => ["/today", "/inbox", "/waiting"].includes(n.to)), { to: "/ai", label: "Ask", icon: MessageSquareText }] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { items, settings } = useNanti();
  const openImport = useImportDialog();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inboxCount = items.filter((i) => i.status === "inbox").length;
  const waitingCount = openItems(items).filter((i) => i.kind === "waiting").length;
  const overdueCount = items.filter(isOverdue).length;
  const counts: Record<string, number> = { "/inbox": inboxCount, "/waiting": waitingCount, "/today": overdueCount };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <div className="px-2 pb-8">
          <Link to="/today">
            <Logo />
          </Link>
        </div>

        <button
          onClick={() => openImport(true)}
          className="mx-1 mb-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-all hover:opacity-95 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Import conversation
        </button>

        <nav className="flex-1 space-y-0.5">
          {mainNav.map((n) => {
            const active = path === n.to || (n.to !== "/today" && path.startsWith(n.to));
            const count = counts[n.to];
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <n.icon className="size-4" />
                <span className="flex-1">{n.label}</span>
                {!!count && count > 0 && (
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="my-3 border-t border-sidebar-border" />

          {bottomNav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <n.icon className="size-4" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="mt-4 flex items-center gap-3 rounded-lg px-2.5 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            {settings.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{settings.name}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">Free plan</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/today">
          <Logo />
        </Link>
        <button
          onClick={() => openImport(true)}
          className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground"
        >
          Import
        </button>
      </header>

      <main className="pb-24 lg:pb-16 lg:pl-64">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileNav.map((n) => {
          const active = path === n.to || (n.to !== "/today" && path.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB */}
      <button
        aria-label="Import conversation"
        onClick={() => openImport(true)}
        className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95 lg:hidden"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-2 flex items-center gap-2 px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
        {count !== undefined && <span className="text-[11px] text-muted-foreground/70">{count}</span>}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
