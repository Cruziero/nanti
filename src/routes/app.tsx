import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/nanti/app-shell";

export const Route = createFileRoute("/app")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <AppShell>
      {/* Nested workspace routes render here. */}
      <Outlet />
    </AppShell>
  );
}
