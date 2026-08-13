import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/nanti/app-shell";
import { Logo } from "@/components/nanti/logo";
import { Textarea } from "@/components/ui/textarea";
import { useNanti } from "@/lib/nanti-store";
import { askAssistant } from "@/lib/nanti-ai.functions";
import { dueLabel, kindLabel, openItems, waitingDays } from "@/lib/nanti-utils";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Tanya NANTI · Memori kerja Anda" },
      { name: "description", content: "Tanya apa saja tentang pekerjaan Anda: apa yang terlupakan, siapa yang menunggu, apa yang jatuh tempo." },
      { property: "og:title", content: "Tanya NANTI · Memori kerja Anda" },
      { property: "og:description", content: "Chief of staff AI yang ingat semua percakapan kerja Anda." },
    ],
  }),
  component: AiPage,
});

const suggestions = [
  "Apa yang saya lupakan?",
  "Apa yang harus saya kerjakan hari ini?",
  "Siapa yang sedang saya tunggu?",
  "Siapa yang menunggu saya?",
  "Apa yang saya janjikan minggu ini?",
  "Apa yang sudah terlambat?",
  "Apa yang paling mendesak?",
  "Siapa yang perlu saya follow up hari ini?",
];

interface Msg {
  role: "user" | "assistant";
  text: string;
}

function AiPage() {
  const { items, personOf, projectOf } = useNanti();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [loading]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildContext = () =>
    openItems(items)
      .map((i) => {
        const p = personOf(i.personId);
        return `- [${kindLabel[i.kind]}] ${i.title} | orang: ${p ? `${p.name} (${p.org})` : "-"} | proyek: ${
          projectOf(i.projectId)?.name ?? "-"
        } | ${i.kind === "waiting" ? `menunggu ${waitingDays(i)} hari` : dueLabel(i)} | sumber: ${i.source} | kutipan: "${i.quote}"`;
      })
      .join("\n");

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askAssistant({ data: { question, context: buildContext() } });
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "NANTI sedang tidak bisa menjawab");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader title="Tanya NANTI" subtitle="Memori kerja Anda" />

      <div className="flex-1 space-y-6">
        {messages.length === 0 && (
          <div className="rise">
            <div className="card-soft p-6">
              <Logo showWord={false} />
              <p className="mt-3 text-[15px] font-medium">Saya ingat semua percakapan kerja Anda.</p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                Tanyakan apa saja — saya akan menjawab dari komitmen, tenggat dan item menunggu Anda.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="rise flex justify-end">
              <p className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-[14.5px] text-primary-foreground">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={i} className="rise whitespace-pre-wrap text-[15px] leading-relaxed">
              {m.text}
            </div>
          ),
        )}

        {loading && (
          <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> NANTI sedang berpikir...
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-20 mt-6 lg:bottom-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-soft">
          <Textarea
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Tanya apa saja tentang pekerjaan Anda..."
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent text-[14.5px] shadow-none focus-visible:ring-0"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
