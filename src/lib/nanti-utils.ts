import type { Item, ItemKind, Priority } from "./nanti-types";

export const today = () => new Date(new Date().setHours(0, 0, 0, 0));

export function toDate(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function daysBetween(iso?: string) {
  const d = toDate(iso);
  if (!d) return 0;
  return Math.round((d.getTime() - today().getTime()) / 86400000);
}

export function isOverdue(item: Item) {
  return item.status === "open" && item.kind !== "waiting" && !!item.due && daysBetween(item.due) < 0;
}

export function isDueToday(item: Item) {
  return item.status === "open" && item.kind !== "waiting" && !!item.due && daysBetween(item.due) === 0;
}

export function dueLabel(item: Item) {
  const diff = daysBetween(item.due);
  if (!item.due) return "Tanpa tenggat";
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === -1) return "Kemarin";
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  return `${diff} hari lagi`;
}

export function waitingDays(item: Item) {
  return Math.abs(daysBetween(item.since));
}

export function formatDate(iso?: string, locale = "id-ID") {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

export function formatDayHeadline(locale = "id-ID") {
  return new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}

export function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  return `${part}, ${name}`;
}

export const kindLabel: Record<ItemKind, string> = {
  task: "Tugas",
  commitment: "Janji",
  deadline: "Tenggat",
  waiting: "Menunggu",
  followup: "Follow-up",
};

export const priorityLabel: Record<Priority, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export function openItems(items: Item[]) {
  return items.filter((i) => i.status === "open");
}

export function newId(prefix = "x") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
