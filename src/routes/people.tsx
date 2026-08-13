import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems } from "@/lib/nanti-utils";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "Orang · NANTI" },
      { name: "description", content: "Memori hubungan kerja: komitmen Anda, komitmen mereka, dan riwayat percakapan." },
      { property: "og:title", content: "Orang · NANTI" },
      { property: "og:description", content: "Ingat siapa menjanjikan apa, kapan." },
    ],
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const { people, items } = useNanti();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = people.filter((p) => (p.name + p.org).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Orang" subtitle="Memori kerja Anda dengan setiap orang" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama atau perusahaan..."
        className="mb-5 bg-surface"
      />
      {list.length === 0 ? (
        <EmptyState title="Tidak ada orang yang cocok." />
      ) : (
        <div className="space-y-3">
          {list.map((p, n) => {
            const mine = openItems(items).filter((i) => i.personId === p.id);
            const waiting = mine.filter((i) => i.kind === "waiting");
            const commitments = mine.filter((i) => i.kind !== "waiting");
            const expanded = openId === p.id;
            return (
              <div key={p.id} style={{ animationDelay: `${n * 35}ms` }} className="rise card-soft p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[14px] font-semibold">
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15.5px] font-semibold">{p.name}</h3>
                    <p className="text-[13px] text-muted-foreground">
                      {p.org}
                      {p.role ? ` · ${p.role}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
                      <span>Percakapan terakhir: {formatDate(p.lastConversation)}</span>
                      <span>Komitmen Anda: {commitments.length}</span>
                      <span>Menunggu dari {p.name.split(" ")[0]}: {waiting.length}</span>
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="rise mt-4 space-y-2 border-t border-border pt-4">
                    {p.activity.map((a) => (
                      <div key={a.date} className="flex gap-3 text-[13.5px]">
                        <span className="w-20 shrink-0 text-muted-foreground">{formatDate(a.date).slice(0, 8)}</span>
                        <span>{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpenId(expanded ? null : p.id)}>
                    {expanded ? "Sembunyikan riwayat" : "Lihat riwayat"}
                  </Button>
                  <Button size="sm" onClick={() => toast.success(`Pengingat follow up ${p.name} dibuat`)}>
                    Follow up
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
