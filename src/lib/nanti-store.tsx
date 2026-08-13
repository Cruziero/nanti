import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Item, Person, Project } from "./nanti-types";
import { items as demoItems, people as demoPeople, projects as demoProjects, dayOffset } from "./nanti-demo";

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
}

const defaultState: State = {
  items: demoItems,
  people: demoPeople,
  projects: demoProjects,
  settings: {
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
  },
};

interface Ctx extends State {
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
  const [state, setState] = useState<State>(defaultState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        setState((s) => ({ ...s, ...parsed, settings: { ...s.settings, ...parsed.settings } }));
      }
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
    (fn: (s: State) => State) => setState((s) => {
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
            const from = i.due ? new Date(i.due) : new Date();
            from.setDate(from.getDate() + days);
            const iso = from.toISOString().slice(0, 10);
            return { ...i, due: i.kind === "waiting" ? i.due : iso, since: i.kind === "waiting" ? dayOffset(0) : i.since };
          }),
        })),
      track: (id) => mutate((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, status: "open" } : i)) })),
      ignore: (id) => mutate((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, status: "ignored" } : i)) })),
      remove: (id) => mutate((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })),
      setSettings: (patch) => mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      reset: () => persist(defaultState),
      personOf: (id) => state.people.find((p) => p.id === id),
      projectOf: (id) => state.projects.find((p) => p.id === id),
    }),
    [state, mutate, persist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNanti() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useNanti must be used inside NantiProvider");
  return ctx;
}
