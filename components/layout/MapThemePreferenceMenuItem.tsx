"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import MindThemePreferenceModal from "@/components/maps/MindThemePreferenceModal";
import { DEFAULT_THEME_NAME } from "@/components/maps/themes";
import { createClient } from "@/utils/supabase/client";

type Props = {
  label: string;
  className?: string;
};

export default function MapThemePreferenceMenuItem({ label, className }: Props) {
  const [open, setOpen] = useState(false);
  const [themeName, setThemeName] = useState<string>(DEFAULT_THEME_NAME);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id ?? null;
      setUserId(id);
      if (!id) return;

      const { data } = await supabase
        .from("profiles")
        .select("mind_theme_preference")
        .eq("id", id)
        .single();
      const pref = (data as { mind_theme_preference?: string | null } | null)
        ?.mind_theme_preference;
      setThemeName(pref ?? DEFAULT_THEME_NAME);
    })();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Icon icon="lucide:palette" className="h-4 w-4" />
        {label}
      </button>

      <MindThemePreferenceModal
        open={open}
        themeName={themeName}
        onClose={() => setOpen(false)}
        onSelectTheme={async (name) => {
          setThemeName(name);
          if (!userId) return;

          await fetch("/api/profile/theme", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mind_theme_preference: name === DEFAULT_THEME_NAME ? null : name,
            }),
          }).catch(() => {});
        }}
      />
    </>
  );
}
