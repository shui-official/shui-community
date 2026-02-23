import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type BeginnerModeCtx = {
  isBeginner: boolean;
  setBeginner: (v: boolean) => void;
  toggleBeginner: () => void;

  guideOpen: boolean;
  setGuideOpen: (v: boolean) => void;

  stepIndex: number;
  setStepIndex: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetGuide: () => void;

  // Coach panel (pro)
  coachOpen: boolean;
  coachTitle: string;
  coachText: string;
  openCoach: (title: string, text: string) => void;
  closeCoach: () => void;

  // ✅ Parcours débutant (persistant)
  didInstallWallet: boolean;
  setDidInstallWallet: (v: boolean) => void;

  didFirstTest: boolean; // swap/LP test
  setDidFirstTest: (v: boolean) => void;

  resetProgress: () => void;
};

const KEY_MODE = "shui_beginner_mode";
const KEY_GUIDE = "shui_beginner_guide_open";
const KEY_STEP = "shui_beginner_step";

// progress keys
const KEY_INSTALL = "shui_beginner_install_wallet";
const KEY_FIRST_TEST = "shui_beginner_first_test";

const Ctx = createContext<BeginnerModeCtx | null>(null);

export function BeginnerModeProvider({ children }: { children: React.ReactNode }) {
  const [isBeginner, setIsBeginner] = useState(false);
  const [guideOpen, setGuideOpenState] = useState(false);
  const [stepIndex, setStepIndexState] = useState(0);

  // Coach panel state (not persisted)
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachTitle, setCoachTitle] = useState("");
  const [coachText, setCoachText] = useState("");

  // Progress (persisted)
  const [didInstallWallet, setDidInstallWalletState] = useState(false);
  const [didFirstTest, setDidFirstTestState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawMode = window.localStorage.getItem(KEY_MODE);
      if (rawMode === "1") setIsBeginner(true);
      if (rawMode === "0") setIsBeginner(false);

      const rawGuide = window.localStorage.getItem(KEY_GUIDE);
      if (rawGuide === "1") setGuideOpenState(true);
      if (rawGuide === "0") setGuideOpenState(false);

      const rawStep = window.localStorage.getItem(KEY_STEP);
      if (rawStep && /^\d+$/.test(rawStep)) setStepIndexState(Number(rawStep));

      const rawInstall = window.localStorage.getItem(KEY_INSTALL);
      if (rawInstall === "1") setDidInstallWalletState(true);
      if (rawInstall === "0") setDidInstallWalletState(false);

      const rawFirst = window.localStorage.getItem(KEY_FIRST_TEST);
      if (rawFirst === "1") setDidFirstTestState(true);
      if (rawFirst === "0") setDidFirstTestState(false);
    } catch {
      // noop
    }
  }, []);

  const persist = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // noop
    }
  };

  const setBeginner = (v: boolean) => {
    setIsBeginner(v);
    persist(KEY_MODE, v ? "1" : "0");

    if (v) {
      // ✅ IMPORTANT: quand on active, on remet un état "guidé" propre
      setCoachOpen(false);
      setCoachTitle("");
      setCoachText("");

      setStepIndex(0);
      setGuideOpen(true);
    } else {
      // Désactivation : on ferme le coach (le guide peut rester fermé)
      setCoachOpen(false);
    }
  };

  const toggleBeginner = () => setBeginner(!isBeginner);

  const setGuideOpen = (v: boolean) => {
    setGuideOpenState(v);
    persist(KEY_GUIDE, v ? "1" : "0");
  };

  const setStepIndex = (n: number) => {
    const safe = Math.max(0, Math.min(9999, n));
    setStepIndexState(safe);
    persist(KEY_STEP, String(safe));
  };

  const nextStep = () => setStepIndex(stepIndex + 1);
  const prevStep = () => setStepIndex(stepIndex - 1);
  const resetGuide = () => {
    setStepIndex(0);
    setGuideOpen(true);
  };

  const openCoach = (title: string, text: string) => {
    setCoachTitle(title);
    setCoachText(text);
    setCoachOpen(true);
  };

  const closeCoach = () => setCoachOpen(false);

  const setDidInstallWallet = (v: boolean) => {
    setDidInstallWalletState(v);
    persist(KEY_INSTALL, v ? "1" : "0");
  };

  const setDidFirstTest = (v: boolean) => {
    setDidFirstTestState(v);
    persist(KEY_FIRST_TEST, v ? "1" : "0");
  };

  const resetProgress = () => {
    setDidInstallWallet(false);
    setDidFirstTest(false);
  };

  const value = useMemo(
    () => ({
      isBeginner,
      setBeginner,
      toggleBeginner,
      guideOpen,
      setGuideOpen,
      stepIndex,
      setStepIndex,
      nextStep,
      prevStep,
      resetGuide,
      coachOpen,
      coachTitle,
      coachText,
      openCoach,
      closeCoach,
      didInstallWallet,
      setDidInstallWallet,
      didFirstTest,
      setDidFirstTest,
      resetProgress,
    }),
    [isBeginner, guideOpen, stepIndex, coachOpen, coachTitle, coachText, didInstallWallet, didFirstTest]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBeginnerMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBeginnerMode must be used within BeginnerModeProvider");
  return ctx;
}
