import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Sparkle, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { KindBadge } from "./kind-badge";
import { useNanti } from "@/lib/nanti-store";
import { analyzeConversation } from "@/lib/nanti-ai.functions";
import type { Item, ItemKind } from "@/lib/nanti-types";
import { newId } from "@/lib/nanti-utils";
import { dayOffset } from "@/lib/nanti-demo";

const SAMPLE = `[Client ABC]
Budi: Pak Rizky, untuk order ABC yang 500 pcs itu mereka minta update price hari ini ya.
Rizky: Baik Pak, besok saya kirim revisi quotation-nya.
Budi: Oke, saya masih tunggu approval dari owner juga.
Rizky: Siap. Kalau sudah ada kabar dari supplier saya kabarin ya.
Budi: Btw meeting dipindah ke jam 3 sore.`;

interface Draft {
  title: string;
  kind: ItemKind;
  priority: "high" | "medium" | "low";
  dueOffsetDays: number | null;
  person: string | null;
  org: string | null;
  source: string | null;
  quote: string;
  aiNote: string;
  confidence: number;
}

const Ctx = createContext<(open: boolean) => void>(() => {});
export const useImportDialog = () => useContext(Ctx);

export function ImportDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const { addItems, people } = useNanti();

  const reset = () => {
    setText("");
    setDrafts(null);
    setSummary("");
    setSelected({});
  };

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setDrafts(null);
    try {
      const res = await analyzeConversation({ data: { text } });
      const list = (res.items as Draft[]) ?? [];
      setDrafts(list);
      setSummary(res.summary);
      setSelected(Object.fromEntries(list.map((_, i) => [i, true])));
      if (!list.length) toast("NANTI tidak menemukan hal yang perlu ditindaklanjuti.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menganalisis percakapan");
    } finally {
      setLoading(false);
    }
  };

  const trackSelected = (all: boolean) => {
    if (!drafts) return;
    const chosen = drafts.filter((_, i) => all || selected[i]);
    if (!chosen.length) return;
    const mapped: Item[] = chosen.map((d) => {
      const match = people.find((p) => d.person && p.name.toLowerCase().includes(d.person.toLowerCase().split(" ")[0]));
      return {
        id: newId("ai"),
        title: d.title,
        kind: (["task", "commitment", "deadline", "waiting", "followup"] as ItemKind[]).includes(d.kind) ? d.kind : "task",
        status: "open",
        priority: d.priority ?? "medium",
        due: d.kind === "waiting" || d.dueOffsetDays == null ? undefined : dayOffset(d.dueOffsetDays),
        since: d.kind === "waiting" ? dayOffset(0) : undefined,
        personId: match?.id,
        source: d.source || "Impor manual",
        quote: d.quote,
        aiNote: d.aiNote,
        confidence: d.confidence ?? 0.8,
        createdBy: "ai",
      };
    });
    addItems(mapped);
    toast.success(`${mapped.length} item dilacak oleh NANTI`);
    reset();
    setOpen(false);
  };

  return (
    <Ctx.Provider value={setOpen}>
      {children}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-lg">Impor percakapan</DialogTitle>
            <DialogDescription>
              Tempel pesan WhatsApp, NANTI yang membaca dan mengingat untuk Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Tempel pesan atau percakapan WhatsApp di sini..."
              className="resize-none bg-surface text-[14px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={analyze} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkle className="size-4" />}
                Analisis dengan NANTI
              </Button>
              <Button variant="outline" onClick={() => setText(SAMPLE)} disabled={loading}>
                Coba contoh
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*,.txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type.startsWith("image/")) {
                      toast("Screenshot diterima. Tempel teksnya di bawah untuk hasil terbaik.");
                      return;
                    }
                    setText(await file.text());
                  }}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input px-4 text-sm font-medium hover:bg-secondary">
                  <Upload className="size-4" /> Unggah file
                </span>
              </label>
            </div>

            {loading && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {drafts && !loading && (
              <div className="rise space-y-3 pt-2">
                <p className="text-[14px] font-medium">
                  Saya menemukan {drafts.length} hal yang perlu ditindaklanjuti.
                </p>
                {summary && <p className="text-[13px] text-muted-foreground">{summary}</p>}
                <div className="space-y-2">
                  {drafts.map((d, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40"
                    >
                      <Checkbox
                        checked={!!selected[i]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium">{d.title}</span>
                          <KindBadge kind={d.kind} />
                        </div>
                        <p className="mt-1 text-[12.5px] italic text-muted-foreground">“{d.quote}”</p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                          {d.person ? `${d.person}${d.org ? ` — ${d.org}` : ""} · ` : ""}
                          {Math.round((d.confidence ?? 0.8) * 100)}% yakin
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {drafts.length > 0 && (
                  <div className="flex gap-2 pb-2">
                    <Button onClick={() => trackSelected(true)}>Lacak semua</Button>
                    <Button variant="outline" onClick={() => trackSelected(false)}>
                      Lacak yang dipilih
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
