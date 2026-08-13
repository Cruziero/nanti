import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Hourglass } from "lucide-react";
import { EmptyState, Section } from "@/components/nanti/app-shell";
import { ItemRow } from "@/components/nanti/item-row";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { formatDayHeadline, greeting, isDueToday, isOverdue, openItems, waitingDays } from "@/lib/nanti-utils";
import { useItemDetail } from "@/components/nanti/item-detail";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hari ini · NANTI" },
      { name: "description", content: "Ringkasan harian dari NANTI : Ingetin lo harus chat siapa hari ini!" },
      { property: "og:title", content: "Hari ini · NANTI" },
      { property: "og:description", content: "Ringkasan harian dari NANTI : Ingetin lo harus chat siapa hari ini!" },
    ],
  }),
  component: Today,
});

function Today() {
  const { items, settings, hydrated, personOf, complete, snooze, update } = useNanti();
  const navigate = useNavigate();
  const openDetail = useItemDetail();
  const [dismissed, setDismissed] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(new Date().getHours() >= 17);

  useEffect(() => {
    if (hydrated && !settings.onboarded) void navigate({ to: "/welcome" });
  }, [hydrated, settings.onboarded, navigate]);

  const overdue = useMemo(() => items.filter(isOverdue), [items]);
  const dueToday = useMemo(() => items.filter(isDueToday), [items]);
  const waiting = useMemo(
    () => openItems(items).filter((i) => i.kind === "waiting").sort((a, b) => waitingDays(b) - waitingDays(a)),
    [items],
  );
  const totalToday = overdue.length + dueToday.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">{greeting(settings.name)}</h1>
        <p className="mt-1 text-[14px] capitalize text-muted-foreground">{formatDayHeadline()}</p>
      </div>

      <div className="rise card-soft mb-9 p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Briefing NANTI</p>
        <p className="mt-3 text-[17px] font-medium leading-relaxed sm:text-[19px]">
          Ada {totalToday} hal yang perlu Anda tangani hari ini.
          {overdue.length > 0 && <> {overdue.length} sudah terlambat.</>}
          {waiting.length > 0 && <> {waiting.length} orang sedang Anda tunggu.</>}
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Prioritas terbesar Anda hari ini adalah order ekspor ABC. Budi menunggu revisi quotation dan supplier belum
          mengonfirmasi jadwal pengiriman.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Tugas", value: openItems(items).filter((i) => i.kind !== "waiting").length },
            { label: "Terlambat", value: overdue.length },
            { label: "Menunggu", value: waiting.length },
            { label: "Hari ini", value: dueToday.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-surface-strong/70 px-3 py-2.5">
              <p className="text-[20px] font-bold leading-none">{s.value}</p>
              <p className="mt-1.5 text-[12px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {overdue.length > 0 && (
        <Section title="Terlambat" count={overdue.length}>
          {overdue.map((i, n) => (
            <ItemRow key={i.id} item={i} index={n} />
          ))}
        </Section>
      )}

      <Section title="Jatuh tempo hari ini" count={dueToday.length}>
        {dueToday.length ? (
          dueToday.map((i, n) => <ItemRow key={i.id} item={i} index={n} />)
        ) : (
          <EmptyState title="Tidak ada yang jatuh tempo hari ini." hint="Napas dulu. NANTI tetap menjaga sisanya." />
        )}
      </Section>

      <Section title="Anda menunggu" count={waiting.length}>
        {waiting.slice(0, 4).map((i, n) => {
          const person = personOf(i.personId);
          return (
            <button
              key={i.id}
              onClick={() => openDetail(i.id)}
              style={{ animationDelay: `${n * 35}ms` }}
              className="rise flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-border hover:bg-surface"
            >
              <Hourglass className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium">
                  {person?.name ?? i.source} — {i.title}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">Menunggu {waitingDays(i)} hari</p>
              </div>
            </button>
          );
        })}
        <div className="px-3 pt-2">
          <Link to="/waiting" className="inline-flex items-center gap-1 text-[13px] font-medium text-primary">
            Lihat semua item menunggu <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Section>

      {!dismissed && overdue[0] && (
        <div className="rise mb-8 rounded-xl border border-primary/25 bg-accent/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">Saran NANTI</p>
          <p className="mt-2.5 text-[14.5px] leading-relaxed">
            Anda menjanjikan {overdue[0].title.toLowerCase()} kepada {personOf(overdue[0].personId)?.name ?? "klien"}{" "}
            kemarin, tetapi saya tidak menemukan tindak lanjut setelah percakapan itu.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { snooze(overdue[0]!.id, 1); toast("Dijadwalkan untuk follow up hari ini"); }}>
              Follow up
            </Button>
            <Button variant="outline" size="sm" onClick={() => { complete(overdue[0]!.id); toast.success("Ditandai selesai"); }}>
              Tandai selesai
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Abaikan
            </Button>
          </div>
        </div>
      )}

      {sweepOpen && (overdue.length > 0 || dueToday.length > 0) && (
        <div className="rise mb-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sebelum Anda tutup hari ini
          </p>
          <p className="mt-2.5 text-[15px] font-medium">
            Masih ada {overdue.length + dueToday.length} hal yang belum selesai.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[...overdue, ...dueToday].slice(0, 5).map((i) => (
              <li key={i.id} className="text-[13.5px] text-muted-foreground">
                · {i.title}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                [...overdue, ...dueToday].forEach((i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  update(i.id, { due: d.toISOString().slice(0, 10) });
                });
                setSweepOpen(false);
                toast.success("Semua dipindahkan ke besok");
              }}
            >
              Pindahkan semua ke besok
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSweepOpen(false)}>
              Nanti saja
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
