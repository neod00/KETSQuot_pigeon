"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CbamApplicationInput } from "@/shared/cbam-input";
import { TAB_STORAGE, DEVICE_STORAGE, DEVICE_RETENTION, readSavedDraft, serializeDraft } from '@/lib/draft-storage';
import type {
  ReadinessAnswer,
  EvidenceStatus,
  NavigatorEvent,
} from "@/shared/cbam-navigator";
export type Draft = {
  sessionId: string;
  startedAt: string;
  productName: string;
  cnCode: string;
  sector: string;
  searchedCnCodes: string[];
  productionProcesses: string;
  productionRoute: string;
  precursors: string;
  country: string;
  sites: string;
  euExport: string;
  importer: string;
  mass: string;
  allImports: boolean;
  answers: Record<string, ReadinessAnswer>;
  evidence: Record<string, EvidenceStatus>;
  readinessIndex: number;
};
export type SearchRequest =
  | { kind: 'codes'; codes: string }
  | { kind: 'product'; productName: string; material?: string; form?: string; use?: string };
const empty: Draft = {
  sessionId: "",
  startedAt: "",
  productName: "",
  cnCode: "",
  sector: "",
  searchedCnCodes: [],
  productionProcesses: "",
  productionRoute: "",
  precursors: "",
  country: "",
  sites: "",
  euExport: "",
  importer: "",
  mass: "",
  allImports: false,
  answers: {},
  evidence: {},
  readinessIndex: 0,
};
type Context = {
  pendingSearch: SearchRequest | null;
  queueSearch: (value: SearchRequest | null) => void;
  draft: Draft;
  setDraft: (value: Partial<Draft>) => void;
  application: Partial<CbamApplicationInput>;
  setApplication: (value: Partial<CbamApplicationInput>) => void;
  ready: boolean;
  error: string;
  track: (event: NavigatorEvent) => void;
  clear: () => void;
  initialized: boolean;
  remember: boolean;
  setRemember: (value: boolean) => void;
  saveStatus: 'saved' | 'unavailable';
};
const Context = createContext<Context | null>(null);
export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [draft, set] = useState<Draft>(empty);
  const [pendingSearch, queueSearch] = useState<SearchRequest | null>(null);
  const [application, setForm] = useState<Partial<CbamApplicationInput>>({});
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [remember, setRemember] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unavailable'>('saved');
  useEffect(() => {
    let active = true;
    let restored: Partial<Draft> = {};
    try {
      const tab = readSavedDraft(sessionStorage.getItem(TAB_STORAGE));
      const device = readSavedDraft(localStorage.getItem(DEVICE_STORAGE));
      if (!device) localStorage.removeItem(DEVICE_STORAGE);
      const saved = device && (!tab || device.savedAt > tab.savedAt) ? device : tab;
      restored = saved?.draft || {};
      setRemember(!!device);
    } catch { setSaveStatus('unavailable'); }
    set({ ...empty, ...restored });
    setInitialized(true);
    fetch("/api/public/cbam/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.message);
        return result;
      })
      .then((result) => {
        if (!active) return;
        set(current => ({
          ...current,
          sessionId: result.sessionId,
          startedAt: current.startedAt || new Date().toISOString(),
        }));
        setReady(true);
      })
      .catch((e) => {
        if (active) setError(e.message || "서비스 연결을 확인해 주세요.");
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!initialized) return;
    try {
      sessionStorage.setItem(TAB_STORAGE, serializeDraft(draft, 24 * 60 * 60 * 1000));
      if (remember) localStorage.setItem(DEVICE_STORAGE, serializeDraft(draft, DEVICE_RETENTION));
      else localStorage.removeItem(DEVICE_STORAGE);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unavailable');
    }
  }, [draft, initialized, remember]);
  const track = (event: NavigatorEvent) => {
    if (ready)
      void fetch("/api/public/cbam/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      }).catch(() => {});
  };
  return (
    <Context.Provider
      value={{
        pendingSearch,
        queueSearch,
        draft,
        setDraft: (v) => set((current) => ({ ...current, ...v })),
        application,
        setApplication: (v) => setForm((current) => ({ ...current, ...v })),
        ready,
        initialized,
        remember,
        setRemember,
        saveStatus,
        error,
        track,
        clear: () => {
          queueSearch(null);
          setForm({});
          set((current) => ({
            ...empty,
            sessionId: current.sessionId,
            startedAt: new Date().toISOString(),
          }));
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useNavigator() {
  const context = useContext(Context);
  if (!context) throw new Error("Navigator context required");
  return context;
}
