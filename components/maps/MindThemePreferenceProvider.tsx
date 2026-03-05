"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type MindThemePreferenceContextValue = {
  profileThemeName: string | null;
};

const MindThemePreferenceContext =
  createContext<MindThemePreferenceContextValue>({
    profileThemeName: null,
  });

export function MindThemePreferenceProvider({
  profileThemeName,
  children,
}: {
  profileThemeName: string | null;
  children: ReactNode;
}) {
  return (
    <MindThemePreferenceContext.Provider value={{ profileThemeName }}>
      {children}
    </MindThemePreferenceContext.Provider>
  );
}

export function useMindThemePreference() {
  return useContext(MindThemePreferenceContext);
}
