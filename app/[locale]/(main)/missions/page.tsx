"use client";

import { useState } from "react";
import MissionTabs from "@/components/missions/MissionTabs";
import MissionParticipatePanel from "@/components/missions/MissionParticipatePanel";
import FeedbackMissionPanel from "@/components/missions/FeedbackMissionPanel";
import MissionHistoryPanel from "@/components/missions/MissionHistoryPanel";

export default function MissionPage() {
  const [tab, setTab] = useState<"participate" | "center">(
    "participate"
  );

  return (
    <div className="mx-auto mt-25 max-w-5xl px-6 md:px-10 pb-24">
      <MissionTabs
        value={tab}
        onValueChange={setTab}
        participate={<MissionParticipatePanel />}
        center={<MissionHistoryPanel />}
      />
    </div>
  );
}
