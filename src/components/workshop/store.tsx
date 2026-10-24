import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BASELINE, clampParams, type ChairParams, type Typology } from "@/lib/chair/params";
import { J_BASELINE, clampJapanese, type JapaneseParams } from "@/lib/chair/japanese/params";
import type { AnyPartId } from "@/lib/chair/parts";
import {
  computeConsequences,
  type Consequences,
  type UserMeasurements,
} from "@/lib/chair/consequences";
import { computeJapaneseConsequences, type JConsequences } from "@/lib/chair/japanese/consequences";
import {
  localRepository,
  EMPTY_PROGRESS,
  type Progress,
  type SavedDesign,
} from "@/lib/storage/repository";
import type { CameraPreset } from "@/lib/lessons";
import {
  evaluateRequirements,
  type RequirementProfileId,
  type RequirementResult,
} from "@/lib/chair/requirements";
import { DEFAULT_SITTER } from "@/lib/chair/fit";

export type { Typology, AnyPartId };
export type AnyParams = ChairParams | JapaneseParams;
export type AnyConsequences = Consequences | JConsequences;
export type Section =
  "discover" | "study" | "design" | "build" | "lab" | "projects" | "library" | "progress";
export type BenchTab = "inspect" | "geometry" | "feedback" | "shop" | "lumber" | "joints" | "ask";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
}

interface Store {
  typology: Typology;
  setTypology: (t: Typology) => void;
  section: Section;
  setSection: (s: Section) => void;
  selected: AnyPartId | null;
  select: (p: AnyPartId | null) => void;
  params: AnyParams;
  setParam: (k: string, v: number | string) => void;
  setParams: (p: AnyParams) => void;
  resetParams: () => void;
  consequences: AnyConsequences;
  requirementProfile: RequirementProfileId;
  setRequirementProfile: (profile: RequirementProfileId) => void;
  requirements: RequirementResult[];
  user: UserMeasurements;
  setUser: (u: UserMeasurements) => void;
  sitter: { active: boolean; run: number };
  runSitter: () => void;
  hideSitter: () => void;
  compare: boolean;
  setCompare: (b: boolean) => void;
  exploded: boolean;
  setExploded: (b: boolean) => void;
  dims: boolean;
  setDims: (b: boolean) => void;
  benchTab: BenchTab;
  setBenchTab: (t: BenchTab) => void;
  camera: { preset: CameraPreset; n: number };
  goView: (p: CameraPreset) => void;
  progress: Progress;
  updateProgress: (fn: (p: Progress) => Progress) => void;
  designs: SavedDesign[];
  saveDesign: (name: string) => void;
  deleteDesign: (id: string) => void;
  chat: ChatMsg[];
  setChat: (fn: (c: ChatMsg[]) => ChatMsg[]) => void;
  pendingQuestion: string | null;
  askMasterAbout: (q: string) => void;
  clearPending: () => void;
}

// Keep one context instance across hot reloads; otherwise editing this file creates a
// second context and already-mounted consumers throw "outside provider".
const g = globalThis as unknown as { __workshopCtx?: React.Context<Store | null> };
const Ctx = (g.__workshopCtx ??= createContext<Store | null>(null));

export function WorkshopProvider({
  initialSection,
  children,
}: {
  initialSection: Section;
  children: ReactNode;
}) {
  const [typology, setTypologyState] = useState<Typology>("kangaroo");
  const [section, setSection] = useState<Section>(initialSection);
  const [selected, select] = useState<AnyPartId | null>(null);
  const [kParams, setKParams] = useState<ChairParams>(BASELINE);
  const [jParams, setJParams] = useState<JapaneseParams>(J_BASELINE);
  const [user, setUserState] = useState<UserMeasurements>(DEFAULT_SITTER);
  const [sitter, setSitter] = useState({ active: false, run: 0 });
  const [requirementProfile, setRequirementProfile] = useState<RequirementProfileId>("lounge");
  const [compare, setCompare] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [dims, setDims] = useState(false);
  const [benchTab, setBenchTab] = useState<BenchTab>("inspect");
  const [camera, setCamera] = useState<{ preset: CameraPreset; n: number }>({
    preset: "three",
    n: 0,
  });
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [chat, setChatState] = useState<ChatMsg[]>([]);
  const [pendingQuestion, setPending] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    const dk = localRepository.getDraft("kangaroo");
    const dj = localRepository.getDraft("japanese");
    if (dk) setKParams(clampParams({ ...BASELINE, ...dk }));
    if (dj) setJParams(clampJapanese({ ...J_BASELINE, ...dj }));
    setProgress(localRepository.getProgress());
    setDesigns(localRepository.listDesigns());
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localRepository.setDraft("kangaroo", kParams);
  }, [kParams]);
  useEffect(() => {
    if (loaded.current) localRepository.setDraft("japanese", jParams);
  }, [jParams]);

  const setTypology = useCallback((t: Typology) => {
    setTypologyState(t);
    select(null);
    setCompare(false);
  }, []);

  const params: AnyParams = typology === "kangaroo" ? kParams : jParams;

  const setParam = useCallback(
    (k: string, v: number | string) => {
      if (typology === "kangaroo") setKParams((p) => clampParams({ ...p, [k]: v }) as ChairParams);
      else setJParams((p) => clampJapanese({ ...p, [k]: v }) as JapaneseParams);
    },
    [typology],
  );
  const updateProgress = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => {
      const n = fn(p);
      localRepository.setProgress(n);
      return n;
    });
  }, []);

  const consequences: AnyConsequences = useMemo(
    () =>
      typology === "kangaroo"
        ? computeConsequences(kParams, BASELINE, user)
        : computeJapaneseConsequences(jParams, J_BASELINE, user),
    [typology, kParams, jParams, user],
  );
  const requirements = useMemo(
    () => evaluateRequirements(requirementProfile, typology, params),
    [requirementProfile, typology, params],
  );

  const value: Store = {
    typology,
    setTypology,
    section,
    setSection,
    selected,
    select,
    params,
    setParam,
    setParams: (p) =>
      typology === "kangaroo"
        ? setKParams(clampParams(p as ChairParams))
        : setJParams(clampJapanese(p as JapaneseParams)),
    resetParams: () => (typology === "kangaroo" ? setKParams(BASELINE) : setJParams(J_BASELINE)),
    consequences,
    requirementProfile,
    setRequirementProfile,
    requirements,
    user,
    setUser: (next) => setUserState((current) => ({ ...current, ...next })),
    sitter,
    runSitter: () => setSitter((current) => ({ active: true, run: current.run + 1 })),
    hideSitter: () => setSitter((current) => ({ ...current, active: false })),
    compare,
    setCompare,
    exploded,
    setExploded,
    dims,
    setDims,
    benchTab,
    setBenchTab,
    camera,
    goView: (preset) => setCamera((c) => ({ preset, n: c.n + 1 })),
    progress,
    updateProgress,
    designs,
    saveDesign: (name) => {
      localRepository.saveDesign(name, typology, params);
      setDesigns(localRepository.listDesigns());
    },
    deleteDesign: (id) => {
      localRepository.deleteDesign(id);
      setDesigns(localRepository.listDesigns());
    },
    chat,
    setChat: setChatState,
    pendingQuestion,
    askMasterAbout: (q) => {
      setBenchTab("ask");
      setPending(q);
    },
    clearPending: () => setPending(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkshop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkshop outside provider");
  return c;
}
