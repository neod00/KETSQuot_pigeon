"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CbamApplicationInput } from "@/shared/cbam-input";
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
};
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
};
type Context = {
  draft: Draft;
  setDraft: (value: Partial<Draft>) => void;
  application: Partial<CbamApplicationInput>;
  setApplication: (value: Partial<CbamApplicationInput>) => void;
  ready: boolean;
  error: string;
  track: (event: NavigatorEvent) => void;
  clear: () => void;
};
const Context = createContext<Context | null>(null);
const STORAGE = "lrqa-cbam-navigator-v1";
export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [draft, set] = useState<Draft>(empty);
  const [application, setForm] = useState<Partial<CbamApplicationInput>>({});
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
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
        let saved: Partial<Draft> = {};
        try {
          const value = JSON.parse(sessionStorage.getItem(STORAGE) || "{}");
          if (value.sessionId === result.sessionId) saved = value;
        } catch {
          /* private browsing */
        }
        set({
          ...empty,
          ...saved,
          sessionId: result.sessionId,
          startedAt: saved.startedAt || new Date().toISOString(),
        });
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
    if (!ready) return;
    // Only diagnostic answers/codes persist. Free text, sites and contacts stay in memory.
    try {
      sessionStorage.setItem(
        STORAGE,
        JSON.stringify({
          sessionId: draft.sessionId,
          startedAt: draft.startedAt,
          cnCode: draft.cnCode,
          sector: draft.sector,
          searchedCnCodes: draft.searchedCnCodes,
          answers: draft.answers,
          evidence: draft.evidence,
        }),
      );
    } catch {
      /* optional persistence */
    }
  }, [draft, ready]);
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
        draft,
        setDraft: (v) => set((current) => ({ ...current, ...v })),
        application,
        setApplication: (v) => setForm((current) => ({ ...current, ...v })),
        ready,
        error,
        track,
        clear: () => {
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
