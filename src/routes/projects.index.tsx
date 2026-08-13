import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, openItems } from "@/lib/nanti-utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Proyek · NANTI" },
      { name: "description", content: "NANTI mengelompokkan pekerjaan dari percakapan Anda menjadi proyek yang jelas." },
      { property: "og:title", content: "Proyek · NANTI" },
      { property: "og:description", content: "Semua komitmen dikelompokkan per proyek secara otomatis." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, items } = useNanti();

  return (
    <div>
      <PageHeader title="Proyek" subtitle="Dikelompokkan otomatis dari percakapan Anda" />
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p, n) => {
          const mine = items.filter((i) => i.projectId === p.id);
          const open = openItems(mine).filter((i) => i.kind !== "waiting").length;
          const waiting = openItems(mine).filter((i) => i.kind === "waiting").length;
          const overdue = mine.filter(isOverdue).length;
          return (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              style={{ animationDelay: `${n * 40}ms` }}
              className="rise card-soft block p-5 transition-shadow hover:shadow-lift"
            >
              <h3 className="text-[16px] font-semibold">{p.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex gap-5 text-[12.5px]">
                <span><b className="text-[15px]">{open}</b> terbuka</span>
                <span><b className="text-[15px]">{waiting}</b> menunggu</span>
                <span className={overdue ? "text-destructive" : ""}>
                  <b className="text-[15px]">{overdue}</b> terlambat
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
