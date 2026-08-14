import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Item, Person, Project } from "./nanti-types";
import { demoItems, demoPeople, demoProjects, dayOffset } from "./nanti-demo";
import { addDays, normalizeDay, todayISO } from "./nanti-utils";

const KEY = "nanti.state.v1";

export interface Settings {
  name: string;
  briefingTime: string;
  endOfDayTime: string;
  notifications: Record<string, boolean>;
  onboarded: boolean;
  role?: string;
  volume?: string;
}

interface State {
  items: Item[];
  people: Person[];
  projects: Project[];
  settings: Settings;
  /** Calendar day (Jakarta) the demo dates were generated for. */
  generatedOn?: string;
}

const defaultSettings: Settings = {
  name: "Rizky",
  briefingTime: "08:00",
  endOfDayTime: "17:30",
  notifications: {
    "Tugas jatuh tempo": true,
    "Tugas terlambat": true,
    "Menunggu terlalu lama": true,
    "Insight baru dari NANTI": true,
    "Briefing harian": true,
    "Sapuan akhir hari": true,
  },
  onboarded: false,
};

/** Empty on the server so SSR never renders date-derived values. */
const emptyState: State = { items: [], people: [], projects: [], settings: defaultSettings };

function freshState(): State {
  return {
    items: demoItems(),
    people: demoPeople(),
    projects: demoProjects(),
    settings: defaultSettings,
    generatedOn: todayISO(),
  };
}

const isDemoItem = (id: string) => /^i\d+$/.test(id);
const isDemoPerson = (id: string) => id.startsWith("p-");

/** Keep demo data relative to the real current day and drop unparseable dates. */
function rebase(state: State): State {
  const today = todayISO();
  const from = normalizeDay(state.generatedOn);
  const shift = from
    ? Math.round(
        (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000,
      )
    : 0;

  const move = (value: string | undefined, demo: boolean) => {
    const day = normalizeDay(value);
    if (!day) return undefined;
    return demo && shift ? addDays(day, shift) : day;
  };

  return {
    ...state,
    generatedOn: today,
    items: (state.items ?? []).map((i) => {
      const demo = isDemoItem(i.id);
      const due = move(i.due, demo);
      const since = move(i.since, demo);
      const next: Item = { ...i };
      if (due) next.due = due;
      else delete next.due;
      if (since) next.since = since;
      else delete next.since;
      return next;
    }),
    people: (state.people ?? []).map((p) => {
      const demo = isDemoPerson(p.id);
      return {
        ...p,
        lastConversation: move(p.lastConversation, demo) ?? todayISO(),
        activity: (p.activity ?? []).map((a) => ({
          ...a,
          date: move(a.date, demo) ?? todayISO(),
        })),
      };
    }),
  };
}

interface Ctx extends State {
  hydrated: boolean;
  update: (id: string, patch: Partial<Item>) => void;
  addItems: (items: Item[]) => void;
  complete: (id: string) => void;
  snooze: (id: string, days: number) => void;
  track: (id: string) => void;
  ignore: (id: string) => void;
  remove: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
  personOf: (id?: string) => Person | undefined;
  projectOf: (id?: string) => Project | undefined;
}

const StoreContext = createContext<Ctx | null>(null);

export function NantiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = freshState();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        next = rebase({
          ...next,
          ...parsed,
          settings: { ...defaultSettings, ...parsed.settings },
        });
      }
    } catch {
      /* ignore */
    }
    setState(next);
    setHydrated(true);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: State) => {
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const mutate = useCallback(
    (fn: (s: State) => State) =>
      setState((s) => {
        const next = fn(s);
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      update: (id, patch) => mutate((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      addItems: (newItems) => mutate((s) => ({ ...s, items: [...newItems, ...s.items] })),
      complete: (id) =>
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === id ? { ...i, status: i.kind === "waiting" ? "received" : "done" } : i)),
        })),
      snooze: (id, days) =>
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            return i.kind === "waiting"
              ? { ...i, since: dayOffset(0) }
              : { ...i, due: addDays(i.due ?? todayISO(), days) };
          }),
        })),
      track: (id) => mutate((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, status: "open" } : i)) })),
      ignore: (id) => mutate((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, status: "ignored" } : i)) })),
      remove: (id) => mutate((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })),
      setSettings: (patch) => mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      reset: () => persist(freshState()),
      personOf: (id) => state.people.find((p) => p.id === id),
      projectOf: (id) => state.projects.find((p) => p.id === id),
    }),
    [state, hydrated, mutate, persist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNanti() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useNanti must be used inside NantiProvider");
  return ctx;
}
