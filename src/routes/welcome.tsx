import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/nanti/logo";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";
import { useImportDialog } from "@/components/nanti/import-dialog";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Mulai dengan NANTI" },
      { name: "description", content: "Tiga langkah singkat untuk menyiapkan memori kerja AI Anda." },
      { property: "og:title", content: "Mulai dengan NANTI" },
      { property: "og:description", content: "Jangan pernah kehilangan komitmen di WhatsApp lagi." },
    ],
  }),
  component: Welcome,
});

const roles = ["Pemilik bisnis", "Sales", "Manajemen proyek", "Operasional", "Marketing", "Properti", "Lainnya"];
const volumes = ["1–10", "10–30", "30–100", "100+"];

function Welcome() {
  const [step, setStep] = useState(0);
  const { setSettings } = useNanti();
  const navigate = useNavigate();
  const openImport = useImportDialog();

  const finish = () => {
    setSettings({ onboarded: true });
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md">
        <Logo className="mb-10" />

        {step === 0 && (
          <div className="rise">
            <h1 className="text-[30px] font-bold leading-tight">Selamat datang di NANTI</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              WhatsApp Anda penuh pekerjaan. NANTI memastikan tidak ada yang terlupakan.
            </p>
            <Button className="mt-8 w-full" size="lg" onClick={() => setStep(1)}>
              Mulai
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Pekerjaan Anda di bidang apa?</h1>
            <div className="mt-6 space-y-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => { setSettings({ role: r }); setStep(2); }}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[14.5px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Berapa banyak percakapan kerja Anda?</h1>
            <div className="mt-6 space-y-2">
              {volumes.map((v) => (
                <button
                  key={v}
                  onClick={() => { setSettings({ volume: v }); setStep(3); }}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[14.5px] transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  {v} percakapan
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rise">
            <h1 className="text-[24px] font-bold">Impor percakapan pertama Anda</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Tempel satu percakapan WhatsApp dan lihat apa yang NANTI temukan.
            </p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" size="lg" onClick={() => { setSettings({ onboarded: true }); openImport(true); }}>
                Tempel percakapan
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={finish}>
                Coba dengan data demo
              </Button>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[12px] text-muted-foreground">
          Jangan pernah kehilangan komitmen di WhatsApp lagi.
        </p>
      </div>
    </div>
  );
}
