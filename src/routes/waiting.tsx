import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/nanti/app-shell";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, openItems, waitingDays } from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";

export const Route = createFileRoute("/waiting")({
  head: () => ({
    meta: [
      { title: "Menunggu · NANTI" },
      { name: "description", content: "Orang dan hal yang sedang Anda tunggu, lengkap dengan berapa lama menunggunya." },
      { property: "og:title", content: "Menunggu · NANTI" },
      { property: "og:description", content: "Jangan biarkan janji orang lain menghilang begitu saja." },
    ],
  }),
  component: WaitingPage,
});

function WaitingPage() {
  const { items, personOf, complete, snooze } = useNanti();
  const openDetail = useItemDetail();
  const list = openItems(items)
    .filter((i) => i.kind === "waiting")
    .sort((a, b) => waitingDays(b) - waitingDays(a));

  return (
    <div>
      <PageHeader title="Menunggu" subtitle="Orang dan hal yang sedang Anda tunggu" />

      <p className="mb-6 text-[14px] font-medium">{list.length} item menunggu belum terselesaikan</p>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada yang Anda tunggu." hint="Semua orang sudah membalas Anda." />
      ) : (
        <div className="space-y-3">
          {list.map((i, n) => {
            const person = personOf(i.personId);
            const days = waitingDays(i);
            const stale = days >= 4;
            return (
              <div
                key={i.id}
                style={{ animationDelay: `${n * 40}ms` }}
                className={
                  "rise card-soft p-5 " + (stale ? "border-warning/50 bg-warning/[0.06]" : "")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <button className="min-w-0 text-left" onClick={() => openDetail(i.id)}>
                    <h3 className="text-[15.5px] font-semibold">
                      {person ? `${person.name} — ${person.org}` : i.source}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">Menunggu: {i.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">Sejak {formatDate(i.since)}</p>
                  </button>
                  <div className="shrink-0 text-right">
                    <p className={"text-[19px] font-bold leading-none " + (stale ? "text-warning-foreground" : "")}>
                      {days}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">hari</p>
                  </div>
                </div>
                {stale && (
                  <p className="mt-3 text-[12.5px] font-medium text-warning-foreground">
                    Sudah tidak wajar lamanya. Sebaiknya ditanyakan langsung.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast.success(`Pengingat follow up dibuat untuk ${person?.name ?? i.source}`)}>
                    Follow up
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { complete(i.id); toast.success("Ditandai sudah diterima"); }}>
                    Sudah diterima
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { snooze(i.id, 2); toast("Ditunda 2 hari"); }}>
                    Tunda
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
