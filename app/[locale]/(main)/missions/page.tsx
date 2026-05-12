"use client";

import { useState } from "react";
import MissionTabs from "@/components/missions/MissionTabs";
import MissionParticipatePanel from "@/components/missions/MissionParticipatePanel";
import MissionHistoryPanel from "@/components/missions/MissionHistoryPanel";

export default function MissionPage() {
  const [tab, setTab] = useState<"participate" | "center">(
    "participate"
  );

  return (
    <section className="relative min-h-[calc(100vh-160px)] overflow-hidden bg-[#e8efff] text-neutral-900 dark:bg-[#020617] dark:text-neutral-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_440px_at_88%_-10%,rgba(14,165,233,0.14),transparent_62%),radial-gradient(760px_420px_at_0%_0%,rgba(59,130,246,0.12),transparent_60%)] dark:bg-[radial-gradient(900px_440px_at_88%_-10%,rgba(56,189,248,0.18),transparent_64%),radial-gradient(760px_420px_at_0%_0%,rgba(59,130,246,0.14),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
      />

      <div className="mx-auto mt-25 max-w-5xl px-6 pb-24 md:px-10">
        <div className="rounded-[28px] border border-slate-300/85 bg-slate-100/70 p-4 shadow-[0_24px_54px_-36px_rgba(15,23,42,0.3)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-950/65 sm:p-5 md:p-6">
          <MissionTabs
            value={tab}
            onValueChange={setTab}
            participate={<MissionParticipatePanel />}
            center={<MissionHistoryPanel />}
          />
        </div>
      </div>
    </section>
  );
}
