import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/nanti/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNanti } from "@/lib/nanti-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan · NANTI" },
      { name: "description", content: "Atur nama, jadwal briefing harian, sapuan akhir hari dan notifikasi NANTI." },
      { property: "og:title", content: "Pengaturan · NANTI" },
      { property: "og:description", content: "Sesuaikan ritme pengingat NANTI dengan hari kerja Anda." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, setSettings, reset } = useNanti();

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Sesuaikan ritme NANTI dengan hari kerja Anda" />

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Profil</h2>
        <Label className="text-[13px]">Nama panggilan</Label>
        <Input
          className="mt-1.5 bg-surface"
          value={settings.name}
          onChange={(e) => setSettings({ name: e.target.value })}
        />
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-4 text-[14px] font-semibold">Waktu pengingat</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[13px]">Briefing harian</Label>
            <Input
              type="time"
              className="mt-1.5 bg-surface"
              value={settings.briefingTime}
              onChange={(e) => setSettings({ briefingTime: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-[13px]">Sapuan akhir hari</Label>
            <Input
              type="time"
              className="mt-1.5 bg-surface"
              value={settings.endOfDayTime}
              onChange={(e) => setSettings({ endOfDayTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card-soft mb-4 p-5">
        <h2 className="mb-2 text-[14px] font-semibold">Notifikasi</h2>
        {Object.entries(settings.notifications).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-border/60 py-3 last:border-0">
            <span className="text-[13.5px]">{k}</span>
            <Switch
              checked={v}
              onCheckedChange={(c) => setSettings({ notifications: { ...settings.notifications, [k]: c } })}
            />
          </div>
        ))}
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-1 text-[14px] font-semibold">Integrasi WhatsApp</h2>
        <p className="text-[13px] text-muted-foreground">
          Koneksi langsung ke WhatsApp belum aktif. Untuk sekarang, impor percakapan secara manual — arsitektur NANTI
          sudah disiapkan untuk integrasi otomatis nanti.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => { reset(); toast.success("Data demo dikembalikan"); }}
        >
          Kembalikan data demo
        </Button>
      </div>
    </div>
  );
}
